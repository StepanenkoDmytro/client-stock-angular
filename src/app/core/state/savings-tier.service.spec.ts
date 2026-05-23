import { TestBed } from '@angular/core/testing';
import { Signal, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { AssetClass } from '../../domain/asset-class.domain';
import { IHolding } from '../../domain/holding.domain';
import { IInstrument } from '../../domain/instrument.domain';
import { InstrumentService } from '../../pages/savings/service/instrument.service';
import { SavingsTier, SavingsTierService } from './savings-tier.service';

/**
 * Lightweight Store stub mirroring the pattern from tags.service.spec.ts
 * (the repo deliberately avoids `@ngrx/store/testing`). Exposes a
 * `pushHoldings(list)` helper so each test can swap the holdings list
 * the service derives the tier from.
 */
class StubStore {
  private readonly state$ = new BehaviorSubject<IHolding[]>([]);
  // The SavingsTierService consumes a single selector — return our
  // state$ directly via `.pipe(select(selectHoldingsList))`. Because
  // `select(...)` is `pipe-able`, we simulate by ignoring the selector
  // and emitting the holdings list straight from our subject.
  pipe(): BehaviorSubject<IHolding[]> {
    return this.state$;
  }
  pushHoldings(list: IHolding[]): void {
    this.state$.next(list);
  }
}

/**
 * Minimal InstrumentService stub. Real one exposes a `Signal<Map<id, IInstrument>>`
 * via `.instruments`; we mirror just that surface and let tests update
 * the map through `setMap()`.
 */
class StubInstrumentService {
  private readonly _instruments = signal<Map<string, IInstrument>>(new Map());
  readonly instruments: Signal<Map<string, IInstrument>> = this._instruments.asReadonly();
  setMap(map: Map<string, IInstrument>): void {
    this._instruments.set(new Map(map));
  }
}

function makeHolding(instrumentId: string): IHolding {
  return {
    id: `h-${instrumentId}-${Math.random()}`,
    instrumentId,
    quantity: 1,
    averageBuyPrice: 100,
    currency: 'USD',
    tagIds: [],
    createdAt: '2026-05-23T00:00:00.000Z',
    updatedAt: '2026-05-23T00:00:00.000Z',
  };
}

function makeInstrument(id: string, assetClass: AssetClass): IInstrument {
  return {
    id,
    assetClass,
    symbol: id,
    name: id,
    currency: 'USD',
    metadata: { kind: assetClass } as IInstrument['metadata'],
    createdBy: 'system',
    createdAt: '2026-05-23T00:00:00.000Z',
  };
}

describe('SavingsTierService', () => {
  let store: StubStore;
  let instruments: StubInstrumentService;

  /**
   * Re-create the service inside a fresh TestBed so the `wasInstalledOnBoot`
   * snapshot picks up the current localStorage state. Tests that exercise
   * the marker transition (T1_FIRST_VISIT → T1_LIGHT) call this after
   * flipping the LS key.
   */
  function makeService(): SavingsTierService {
    TestBed.resetTestingModule();
    store = new StubStore();
    instruments = new StubInstrumentService();
    TestBed.configureTestingModule({
      providers: [
        SavingsTierService,
        { provide: Store, useValue: store },
        { provide: InstrumentService, useValue: instruments },
      ],
    });
    return TestBed.inject(SavingsTierService);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns T1_FIRST_VISIT when pgz-installed marker is absent on boot', () => {
    const service = makeService();
    expect(service.tier()).toBe('T1_FIRST_VISIT');
  });

  it('keeps T1_FIRST_VISIT for the current session even after markInstalled() writes the marker', () => {
    const service = makeService();
    expect(service.tier()).toBe('T1_FIRST_VISIT');
    service.markInstalled();
    expect(localStorage.getItem('pgz-installed')).toBe('1');
    // Boot snapshot is sticky — same session shouldn't yank the hero out.
    expect(service.tier()).toBe('T1_FIRST_VISIT');
  });

  it('routes a returning user with the marker + zero holdings to T1_LIGHT', () => {
    localStorage.setItem('pgz-installed', '1');
    const service = makeService();
    expect(service.tier()).toBe('T1_LIGHT');
  });

  it('moves to T2 when a single AssetClass appears in holdings', () => {
    localStorage.setItem('pgz-installed', '1');
    const service = makeService();
    instruments.setMap(new Map([['i-aapl', makeInstrument('i-aapl', AssetClass.STOCK)]]));
    store.pushHoldings([makeHolding('i-aapl')]);
    expect(service.distinctAssetClassCount()).toBe(1);
    expect(service.tier()).toBe('T2');
  });

  it('stays in T2 with two distinct AssetClasses', () => {
    localStorage.setItem('pgz-installed', '1');
    const service = makeService();
    instruments.setMap(new Map([
      ['i-aapl', makeInstrument('i-aapl', AssetClass.STOCK)],
      ['i-btc', makeInstrument('i-btc', AssetClass.CRYPTO)],
    ]));
    store.pushHoldings([makeHolding('i-aapl'), makeHolding('i-btc')]);
    expect(service.distinctAssetClassCount()).toBe(2);
    expect(service.tier()).toBe('T2');
  });

  it('flips out of T1_FIRST_VISIT to T3 when «Try demo» seeds data in the same session (data-first per §4.2)', () => {
    // Cold mount: no marker, no data → T1_FIRST_VISIT.
    const service = makeService();
    expect(service.tier()).toBe('T1_FIRST_VISIT');
    // User taps «Try with demo data» (PR3) → 3+ classes appear before
    // any reload. Even though the boot snapshot stays at "no marker",
    // the data-first rule takes over and routes the user to T3.
    instruments.setMap(new Map([
      ['i-aapl', makeInstrument('i-aapl', AssetClass.STOCK)],
      ['i-btc', makeInstrument('i-btc', AssetClass.CRYPTO)],
      ['i-cash', makeInstrument('i-cash', AssetClass.CASH)],
    ]));
    store.pushHoldings([
      makeHolding('i-aapl'),
      makeHolding('i-btc'),
      makeHolding('i-cash'),
    ]);
    expect(service.tier()).toBe('T3');
  });

  it('advances to T3 once a third distinct AssetClass is added', () => {
    localStorage.setItem('pgz-installed', '1');
    const service = makeService();
    instruments.setMap(new Map([
      ['i-aapl', makeInstrument('i-aapl', AssetClass.STOCK)],
      ['i-btc', makeInstrument('i-btc', AssetClass.CRYPTO)],
      ['i-cash', makeInstrument('i-cash', AssetClass.CASH)],
    ]));
    store.pushHoldings([
      makeHolding('i-aapl'),
      makeHolding('i-btc'),
      makeHolding('i-cash'),
    ]);
    expect(service.distinctAssetClassCount()).toBe(3);
    expect(service.tier()).toBe('T3');
  });

  it('skips holdings whose instrument is missing from the cache (mid-bootstrap race)', () => {
    localStorage.setItem('pgz-installed', '1');
    const service = makeService();
    // Holding present but instrument not yet in cache — should be ignored,
    // tier stays T1_LIGHT until the cache catches up.
    store.pushHoldings([makeHolding('i-orphan')]);
    expect(service.distinctAssetClassCount()).toBe(0);
    expect(service.tier()).toBe('T1_LIGHT');
  });

  // ---------------------------------------------------------------
  // PR4 — Discovery row: missing-classes derivation
  // ---------------------------------------------------------------

  it('discoveryClasses defaults to [STOCK, REAL_ESTATE, CASH] when portfolio is empty', () => {
    localStorage.setItem('pgz-installed', '1');
    const service = makeService();
    expect(service.discoveryClasses()).toEqual([
      AssetClass.STOCK,
      AssetClass.REAL_ESTATE,
      AssetClass.CASH,
    ]);
  });

  it('discoveryClasses excludes asset classes the user already tracks', () => {
    localStorage.setItem('pgz-installed', '1');
    const service = makeService();
    // User has STOCK + CASH — defaults would be STOCK/REAL_ESTATE/CASH,
    // but STOCK + CASH are present, so the chain falls through to
    // REAL_ESTATE → CRYPTO → ETF for the top 3.
    instruments.setMap(new Map([
      ['i-aapl', makeInstrument('i-aapl', AssetClass.STOCK)],
      ['i-cash', makeInstrument('i-cash', AssetClass.CASH)],
    ]));
    store.pushHoldings([makeHolding('i-aapl'), makeHolding('i-cash')]);
    expect(service.discoveryClasses()).toEqual([
      AssetClass.REAL_ESTATE,
      AssetClass.CRYPTO,
      AssetClass.ETF,
    ]);
  });

  it('discoveryClasses shrinks as the portfolio approaches T3', () => {
    localStorage.setItem('pgz-installed', '1');
    const service = makeService();
    // 6 of 8 classes present → only 2 missing (TOKENIZED_STOCK + OTHER).
    instruments.setMap(new Map([
      ['i-aapl', makeInstrument('i-aapl', AssetClass.STOCK)],
      ['i-vti', makeInstrument('i-vti', AssetClass.ETF)],
      ['i-btc', makeInstrument('i-btc', AssetClass.CRYPTO)],
      ['i-cash', makeInstrument('i-cash', AssetClass.CASH)],
      ['i-dep', makeInstrument('i-dep', AssetClass.DEPOSIT)],
      ['i-re', makeInstrument('i-re', AssetClass.REAL_ESTATE)],
    ]));
    store.pushHoldings([
      makeHolding('i-aapl'),
      makeHolding('i-vti'),
      makeHolding('i-btc'),
      makeHolding('i-cash'),
      makeHolding('i-dep'),
      makeHolding('i-re'),
    ]);
    expect(service.discoveryClasses()).toEqual([
      AssetClass.TOKENIZED_STOCK,
      AssetClass.OTHER,
    ]);
  });

  it('markInstalled() is idempotent across repeat calls', () => {
    const service = makeService();
    service.markInstalled();
    service.markInstalled();
    service.markInstalled();
    expect(localStorage.getItem('pgz-installed')).toBe('1');
  });
});
