import { TestBed } from '@angular/core/testing';
import { Signal, signal } from '@angular/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { IAccountV2 } from '../../domain/account-v2.domain';
import { IHolding } from '../../domain/holding.domain';
import { IInstrument } from '../../domain/instrument.domain';
import { ITag } from '../../domain/tag.domain';
import { InstrumentService } from '../../pages/savings/service/instrument.service';
import { selectAccountsList } from '../../pages/savings/store/accounts.selectors';
import { selectHoldingsList } from '../../pages/savings/store/holdings.selectors';
import { selectTagsList } from '../../pages/savings/store/tags.selectors';
import { DemoDataService } from './demo-data.service';

/**
 * Reactive signals consumed by the PR5 banner + Profile row:
 *   - {@link DemoDataService#isDemoActive}
 *   - {@link DemoDataService#demoItemsCount}
 *
 * Uses `provideMockStore` (the only spec in this repo that goes through
 * `@ngrx/store/testing` so far) — the existing stub patterns in
 * `tags.service.spec.ts` predate this need for selector-by-selector
 * overrides, which MockStore handles natively.
 */
class StubInstrumentService {
  readonly instruments: Signal<Map<string, IInstrument>> = signal(new Map()).asReadonly();
}

function holding(id: string, isDemo?: boolean): IHolding {
  return {
    id,
    instrumentId: 'inst',
    quantity: 1,
    averageBuyPrice: 1,
    currency: 'USD',
    tagIds: [],
    createdAt: '2026-05-23T00:00:00.000Z',
    updatedAt: '2026-05-23T00:00:00.000Z',
    ...(isDemo ? { isDemo: true } : {}),
  };
}

function account(id: string, isDemo?: boolean): IAccountV2 {
  return {
    id,
    accountType: 'MANUAL',
    ...(isDemo ? { isDemo: true } : {}),
  } as IAccountV2;
}

function tag(id: string, isDemo?: boolean): ITag {
  return {
    id,
    name: id,
    color: '#888',
    system: true,
    createdAt: '2026-05-23T00:00:00.000Z',
    ...(isDemo ? { isDemo: true } : {}),
  };
}

describe('DemoDataService — reactive signals (PR5)', () => {
  let mockStore: MockStore;
  let service: DemoDataService;

  function setLists(args: {
    holdings?: IHolding[];
    accounts?: IAccountV2[];
    tags?: ITag[];
  }): void {
    if (args.holdings !== undefined) {
      mockStore.overrideSelector(selectHoldingsList, args.holdings);
    }
    if (args.accounts !== undefined) {
      mockStore.overrideSelector(selectAccountsList, args.accounts);
    }
    if (args.tags !== undefined) {
      mockStore.overrideSelector(selectTagsList, args.tags);
    }
    mockStore.refreshState();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DemoDataService,
        provideMockStore({
          initialState: {},
          selectors: [
            { selector: selectHoldingsList, value: [] },
            { selector: selectAccountsList, value: [] },
            { selector: selectTagsList, value: [] },
          ],
        }),
        { provide: InstrumentService, useValue: new StubInstrumentService() },
      ],
    });
    mockStore = TestBed.inject(MockStore);
    service = TestBed.inject(DemoDataService);
  });

  it('isDemoActive is false when every store is empty', () => {
    expect(service.isDemoActive()).toBe(false);
    expect(service.demoItemsCount()).toBe(0);
  });

  it('isDemoActive flips to true when any slice gets a demo row', () => {
    setLists({ holdings: [holding('h1', true)] });
    expect(service.isDemoActive()).toBe(true);
    expect(service.demoItemsCount()).toBe(1);
  });

  it('ignores real (non-demo) rows when counting', () => {
    setLists({
      holdings: [holding('real-h')],
      accounts: [account('real-a')],
      tags: [tag('real-t')],
    });
    expect(service.isDemoActive()).toBe(false);
    expect(service.demoItemsCount()).toBe(0);
  });

  it('counts demo rows across all three slices', () => {
    setLists({
      holdings: [holding('h1', true), holding('h2', true)],
      accounts: [account('a1', true), account('a2', true), account('a3', true)],
      tags: [tag('t1', true)],
    });
    expect(service.isDemoActive()).toBe(true);
    expect(service.demoItemsCount()).toBe(6);
  });

  it('flips back to false when all demo rows are removed (clear flow)', () => {
    setLists({ holdings: [holding('h1', true)] });
    expect(service.isDemoActive()).toBe(true);
    setLists({ holdings: [] });
    expect(service.isDemoActive()).toBe(false);
    expect(service.demoItemsCount()).toBe(0);
  });

  it('keeps real rows in the count of zero — Profile row should read "Cleared"', () => {
    // Real entities live alongside demo. Clear flow filters out only
    // isDemo:true; we mimic that final state here.
    setLists({
      holdings: [holding('real-h')],
      accounts: [account('real-a')],
      tags: [tag('real-t')],
    });
    expect(service.demoItemsCount()).toBe(0);
    expect(service.isDemoActive()).toBe(false);
  });
});
