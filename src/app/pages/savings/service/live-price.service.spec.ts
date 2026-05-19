import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { MarketStatus } from '../../../domain/market-status.domain';
import { InstrumentService } from './instrument.service';
import { LivePriceService } from './live-price.service';
import { MarketStatusService } from './market-status.service';

class FakeStore {
  readonly holdings$ = new BehaviorSubject<IHolding[]>([]);
  select() {
    return this.holdings$.asObservable();
  }
}

class FakeInstrumentService {
  private readonly _map = signal<Map<string, IInstrument>>(new Map());
  readonly instruments = this._map.asReadonly();
  set(insts: IInstrument[]) {
    const m = new Map<string, IInstrument>();
    for (const i of insts) m.set(i.id, i);
    this._map.set(m);
  }
}

class FakeMarketStatusService {
  private readonly statuses = new Map<string, MarketStatus>();
  set(code: string, status: MarketStatus) {
    this.statuses.set(code, status);
  }
  getStatus(code: string): MarketStatus | undefined {
    return this.statuses.get(code);
  }
  static exchangeOf = MarketStatusService.exchangeOf;
}

function stockInst(id: string, symbol: string, exchange: string): IInstrument {
  return {
    id,
    symbol,
    assetClass: AssetClass.STOCK,
    name: symbol,
    currency: 'USD',
    metadata: { kind: AssetClass.STOCK, exchange, currency: 'USD' },
    createdBy: 'system',
    createdAt: '2026-01-01T00:00:00Z',
  } as IInstrument;
}

function cryptoInst(id: string, symbol: string): IInstrument {
  return {
    id,
    symbol,
    assetClass: AssetClass.CRYPTO,
    name: symbol,
    currency: 'USD',
    metadata: { kind: AssetClass.CRYPTO, coinId: symbol.toLowerCase() },
    createdBy: 'system',
    createdAt: '2026-01-01T00:00:00Z',
  } as IInstrument;
}

function cashInst(id: string, currency: string): IInstrument {
  return {
    id,
    symbol: currency,
    assetClass: AssetClass.CASH,
    name: `${currency} Cash`,
    currency,
    metadata: { kind: AssetClass.CASH, currency },
    createdBy: 'system',
    createdAt: '2026-01-01T00:00:00Z',
  } as IInstrument;
}

function holding(id: string, instrumentId: string): IHolding {
  return {
    id,
    instrumentId,
    quantity: 1,
    averageBuyPrice: 100,
    currency: 'USD',
    tagIds: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
}

describe('LivePriceService', () => {
  let svc: LivePriceService;
  let httpMock: HttpTestingController;
  let store: FakeStore;
  let instruments: FakeInstrumentService;
  let marketStatus: FakeMarketStatusService;

  beforeEach(() => {
    store = new FakeStore();
    instruments = new FakeInstrumentService();
    marketStatus = new FakeMarketStatusService();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Store, useValue: store },
        { provide: InstrumentService, useValue: instruments },
        { provide: MarketStatusService, useValue: marketStatus },
        LivePriceService,
      ],
    });
    svc = TestBed.inject(LivePriceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Drop the periodic interval(30s) timer left over by svc.init() so
  // fakeAsync's "X periodic timer(s) still in the queue" guard doesn't fail.
  function cleanup(): void {
    discardPeriodicTasks();
  }

  it('init fetches batch for all tracked ids and stores quotes', fakeAsync(() => {
    instruments.set([stockInst('a', 'AAPL', 'NASDAQ'), cryptoInst('b', 'BTC')]);
    store.holdings$.next([holding('h1', 'a'), holding('h2', 'b')]);

    svc.init();
    tick(0);

    const req = httpMock.expectOne((r) => r.url.endsWith('/prices/batch'));
    const idsParam = req.request.params.get('ids') ?? '';
    expect(idsParam.split(',').sort()).toEqual(['a', 'b']);

    req.flush({
      quotes: [
        { instrumentId: 'a', symbol: 'AAPL', price: 175, currency: 'USD',
          assetClass: 'STOCK', capturedAt: 1, stale: false },
        { instrumentId: 'b', symbol: 'BTC', price: 60000, currency: 'USD',
          assetClass: 'CRYPTO', capturedAt: 1, stale: false },
      ],
    });

    expect(svc.getCurrentPrice('a')).toBe(175);
    expect(svc.getCurrentPrice('b')).toBe(60000);
    expect(svc.getCurrentPriceBySymbol('AAPL')).toBe(175);
    cleanup();
  }));

  it('skips closed exchanges (smart pause) — NYSE closed, NASDAQ open', fakeAsync(() => {
    instruments.set([
      stockInst('a', 'AAPL', 'NASDAQ'),
      stockInst('b', 'GE', 'NYSE'),
    ]);
    marketStatus.set('NASDAQ', {
      code: 'NASDAQ', isOpen: true, session: 'REGULAR', nextChangeAt: null,
    });
    marketStatus.set('NYSE', {
      code: 'NYSE', isOpen: false, session: 'WEEKEND', nextChangeAt: null,
    });
    store.holdings$.next([holding('h1', 'a'), holding('h2', 'b')]);

    svc.init();
    tick(0);

    const req = httpMock.expectOne((r) => r.url.endsWith('/prices/batch'));
    expect(req.request.params.get('ids')).toBe('a');
    req.flush({ quotes: [] });
    cleanup();
  }));

  it('always polls CRYPTO + CASH regardless of stock-exchange status', fakeAsync(() => {
    instruments.set([
      stockInst('a', 'AAPL', 'NASDAQ'),
      cryptoInst('b', 'BTC'),
      cashInst('c', 'USD'),
    ]);
    marketStatus.set('NASDAQ', {
      code: 'NASDAQ', isOpen: false, session: 'WEEKEND', nextChangeAt: null,
    });
    // CRYPTO status not set → status undefined → first-tick pass-through (don't skip).
    store.holdings$.next([
      holding('h1', 'a'),
      holding('h2', 'b'),
      holding('h3', 'c'),
    ]);

    svc.init();
    tick(0);

    const req = httpMock.expectOne((r) => r.url.endsWith('/prices/batch'));
    const ids = (req.request.params.get('ids') ?? '').split(',').sort();
    // 'a' (NASDAQ closed) skipped; 'b' (CRYPTO, no status) included; 'c' (CASH, no code) included.
    expect(ids).toEqual(['b', 'c']);
    req.flush({ quotes: [] });
    cleanup();
  }));

  it('first tick still fetches when status not yet loaded for an exchange', fakeAsync(() => {
    instruments.set([stockInst('a', 'AAPL', 'NASDAQ')]);
    store.holdings$.next([holding('h1', 'a')]);

    svc.init();
    tick(0);

    const req = httpMock.expectOne((r) => r.url.endsWith('/prices/batch'));
    expect(req.request.params.get('ids')).toBe('a');
    req.flush({ quotes: [] });
    cleanup();
  }));

  it('does not fire HTTP when no holdings present', fakeAsync(() => {
    store.holdings$.next([]);
    svc.init();
    tick(0);
    httpMock.expectNone((r) => r.url.endsWith('/prices/batch'));
    cleanup();
  }));

  it('init is idempotent', fakeAsync(() => {
    instruments.set([cryptoInst('b', 'BTC')]);
    store.holdings$.next([holding('h1', 'b')]);

    svc.init();
    svc.init();
    tick(0);

    const reqs = httpMock.match((r) => r.url.endsWith('/prices/batch'));
    expect(reqs.length).toBe(1);
    reqs[0].flush({ quotes: [] });
    cleanup();
  }));

  it('getFlashDirection: up on price increase, down on decrease, null after timeout', fakeAsync(() => {
    instruments.set([cryptoInst('b', 'BTC')]);
    store.holdings$.next([holding('h1', 'b')]);
    svc.init();
    tick(0);

    const r1 = httpMock.expectOne((r) => r.url.endsWith('/prices/batch'));
    r1.flush({
      quotes: [{
        instrumentId: 'b', symbol: 'BTC', price: 60000, currency: 'USD',
        assetClass: 'CRYPTO', capturedAt: 1, stale: false,
      }],
    });
    // First poll has no baseline → no flash.
    expect(svc.getFlashDirection('b')).toBeNull();

    tick(30_000);
    const r2 = httpMock.expectOne((r) => r.url.endsWith('/prices/batch'));
    r2.flush({
      quotes: [{
        instrumentId: 'b', symbol: 'BTC', price: 60500, currency: 'USD',
        assetClass: 'CRYPTO', capturedAt: 2, stale: false,
      }],
    });
    expect(svc.getFlashDirection('b')).toBe('up');

    tick(600);
    expect(svc.getFlashDirection('b')).toBeNull();

    // drain remaining timers
    tick(30_000);
    const r3 = httpMock.expectOne((r) => r.url.endsWith('/prices/batch'));
    r3.flush({
      quotes: [{
        instrumentId: 'b', symbol: 'BTC', price: 60100, currency: 'USD',
        assetClass: 'CRYPTO', capturedAt: 3, stale: false,
      }],
    });
    expect(svc.getFlashDirection('b')).toBe('down');
    tick(600);
    cleanup();
  }));

  it('swallows HTTP errors and keeps the last successful quote', fakeAsync(() => {
    instruments.set([cryptoInst('b', 'BTC')]);
    store.holdings$.next([holding('h1', 'b')]);
    svc.init();
    tick(0);

    const r1 = httpMock.expectOne((r) => r.url.endsWith('/prices/batch'));
    r1.flush({
      quotes: [{
        instrumentId: 'b', symbol: 'BTC', price: 60000, currency: 'USD',
        assetClass: 'CRYPTO', capturedAt: 1, stale: false,
      }],
    });
    expect(svc.getCurrentPrice('b')).toBe(60000);

    tick(30_000);
    const r2 = httpMock.expectOne((r) => r.url.endsWith('/prices/batch'));
    r2.error(new ProgressEvent('boom'), { status: 503, statusText: 'down' });
    expect(svc.getCurrentPrice('b')).toBe(60000);
    cleanup();
  }));
});
