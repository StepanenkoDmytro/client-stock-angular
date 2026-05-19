import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import {
  CRYPTO_EXCHANGE_CODE,
  MarketStatus,
} from '../../../domain/market-status.domain';
import { InstrumentService } from './instrument.service';
import { MarketStatusService } from './market-status.service';

class FakeStore {
  readonly holdings$ = new BehaviorSubject<IHolding[]>([]);
  select() {
    return this.holdings$.asObservable();
  }
}

class FakeInstrumentService {
  readonly _map = signal<Map<string, IInstrument>>(new Map());
  readonly instruments = this._map.asReadonly();
  set(insts: IInstrument[]) {
    const m = new Map<string, IInstrument>();
    for (const i of insts) m.set(i.id, i);
    this._map.set(m);
  }
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

describe('MarketStatusService', () => {
  let svc: MarketStatusService;
  let httpMock: HttpTestingController;
  let store: FakeStore;
  let instruments: FakeInstrumentService;

  beforeEach(() => {
    store = new FakeStore();
    instruments = new FakeInstrumentService();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Store, useValue: store },
        { provide: InstrumentService, useValue: instruments },
        MarketStatusService,
      ],
    });
    svc = TestBed.inject(MarketStatusService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('exchangeOf returns metadata.exchange for STOCK/ETF', () => {
    const aapl = stockInst('1', 'AAPL', 'NASDAQ');
    expect(MarketStatusService.exchangeOf(aapl)).toBe('NASDAQ');
  });

  it('exchangeOf returns CRYPTO_EXCHANGE_CODE for CRYPTO', () => {
    const btc = cryptoInst('2', 'BTC');
    expect(MarketStatusService.exchangeOf(btc)).toBe(CRYPTO_EXCHANGE_CODE);
  });

  it('exchangeOf returns undefined for CASH', () => {
    const cash = {
      id: '3',
      symbol: 'USD',
      assetClass: AssetClass.CASH,
      name: 'USD',
      currency: 'USD',
      metadata: { kind: AssetClass.CASH, currency: 'USD' },
    } as IInstrument;
    expect(MarketStatusService.exchangeOf(cash)).toBeUndefined();
  });

  it('exchangeOf returns undefined when STOCK metadata has empty exchange', () => {
    const noEx = stockInst('4', 'XYZ', '');
    expect(MarketStatusService.exchangeOf(noEx)).toBeUndefined();
  });

  it('init fetches batch for distinct exchange codes from holdings', () => {
    const aapl = stockInst('a', 'AAPL', 'NASDAQ');
    const ge = stockInst('b', 'GE', 'NYSE');
    const btc = cryptoInst('c', 'BTC');
    instruments.set([aapl, ge, btc]);
    store.holdings$.next([
      holding('h1', 'a'),
      holding('h2', 'b'),
      holding('h3', 'c'),
    ]);

    svc.init();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/markets/status') && r.params.has('codes'),
    );
    const codes = (req.request.params.get('codes') ?? '').split(',').sort();
    expect(codes).toEqual(['CRYPTO', 'NASDAQ', 'NYSE']);

    const nasdaqOpen: MarketStatus = {
      code: 'NASDAQ', isOpen: true, session: 'REGULAR', nextChangeAt: null,
    };
    req.flush({ statuses: [nasdaqOpen] });

    expect(svc.getStatus('NASDAQ')).toEqual(nasdaqOpen);
    expect(svc.getStatus('NYSE')).toBeUndefined();
  });

  it('init is idempotent (second init does not start second poll)', () => {
    instruments.set([stockInst('a', 'AAPL', 'NASDAQ')]);
    store.holdings$.next([holding('h1', 'a')]);

    svc.init();
    svc.init();

    const reqs = httpMock.match((r) => r.url.endsWith('/markets/status'));
    expect(reqs.length).toBe(1);
    reqs[0].flush({ statuses: [] });
  });

  it('init does not fire HTTP when no exchange codes present', () => {
    store.holdings$.next([]);
    svc.init();
    httpMock.expectNone((r) => r.url.endsWith('/markets/status'));
  });

  it('absorb merges new statuses without dropping prior codes', () => {
    instruments.set([
      stockInst('a', 'AAPL', 'NASDAQ'),
      stockInst('b', 'GE', 'NYSE'),
    ]);
    store.holdings$.next([holding('h1', 'a'), holding('h2', 'b')]);
    svc.init();

    const req = httpMock.expectOne((r) => r.url.endsWith('/markets/status'));
    req.flush({
      statuses: [
        { code: 'NASDAQ', isOpen: true, session: 'REGULAR', nextChangeAt: null },
      ],
    });
    expect(svc.getStatus('NASDAQ')?.isOpen).toBe(true);
    expect(svc.getStatus('NYSE')).toBeUndefined();
  });

  it('swallows HTTP errors and keeps last known status', () => {
    instruments.set([stockInst('a', 'AAPL', 'NASDAQ')]);
    store.holdings$.next([holding('h1', 'a')]);
    svc.init();

    const req = httpMock.expectOne((r) => r.url.endsWith('/markets/status'));
    req.error(new ProgressEvent('Network down'), { status: 503, statusText: 'down' });

    expect(svc.getStatus('NASDAQ')).toBeUndefined();
  });
});
