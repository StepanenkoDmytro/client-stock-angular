import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetClass } from '../../../../../domain/asset-class.domain';
import { IHoldingView } from '../../../../../domain/holding.domain';
import { IInstrument } from '../../../../../domain/instrument.domain';
import { IPosition } from '../../../../../domain/position.domain';
import { PositionCardComponent } from './position-card.component';

function makeInstrument(
  symbol: string,
  assetClass: AssetClass = AssetClass.STOCK,
): IInstrument {
  return {
    id: `inst-${symbol}`,
    assetClass,
    symbol,
    name: symbol,
    currency: 'USD',
    metadata:
      assetClass === AssetClass.STOCK
        ? { kind: AssetClass.STOCK, exchange: 'NYSE', currency: 'USD' }
        : assetClass === AssetClass.CRYPTO
        ? { kind: AssetClass.CRYPTO, coinId: symbol.toLowerCase() }
        : { kind: AssetClass.CASH, currency: 'USD' },
    createdBy: 'system',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeHolding(
  instrument: IInstrument,
  overrides: Partial<IHoldingView> = {},
): IHoldingView {
  return {
    id: overrides.id ?? `h-${Math.random()}`,
    instrumentId: instrument.id,
    quantity: 1,
    averageBuyPrice: 100,
    currency: 'USD',
    tagIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    instrument,
    tags: [],
    ...overrides,
  };
}

function makePosition(holdings: IHoldingView[]): IPosition {
  const totalQuantity = holdings.reduce((s, h) => s + h.quantity, 0);
  const totalCostBasis = holdings.reduce(
    (s, h) => s + h.quantity * h.averageBuyPrice,
    0,
  );
  const holdingValues = holdings.map((h) => h.quantity * h.averageBuyPrice);
  const totalValue = holdingValues.reduce((s, v) => s + v, 0);
  return {
    instrument: holdings[0].instrument,
    holdings,
    holdingValues,
    totalQuantity,
    totalValue,
    totalCostBasis,
    weightedAvgPrice: totalQuantity > 0 ? totalCostBasis / totalQuantity : 0,
    paperPnL: 0,
    paperPnLPct: 0,
    tags: [],
  };
}

describe('PositionCardComponent', () => {
  let fixture: ComponentFixture<PositionCardComponent>;
  let component: PositionCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PositionCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PositionCardComponent);
    component = fixture.componentInstance;
  });

  it('renders a single-holding Position without a chevron', () => {
    const inst = makeInstrument('AAPL');
    component.position = makePosition([makeHolding(inst)]);
    fixture.detectChanges();

    const chevron = fixture.nativeElement.querySelector('.pc__chevron');
    expect(chevron).toBeNull();
    expect(component.isMulti()).toBe(false);
  });

  it('renders a multi-holding Position with a chevron + "across N locations" subline', () => {
    const inst = makeInstrument('BTC', AssetClass.CRYPTO);
    const h1 = makeHolding(inst, { quantity: 0.5 });
    const h2 = makeHolding(inst, { quantity: 0.3 });
    const h3 = makeHolding(inst, { quantity: 0.2 });
    component.position = makePosition([h1, h2, h3]);
    fixture.detectChanges();

    const chevron = fixture.nativeElement.querySelector('.pc__chevron');
    expect(chevron).not.toBeNull();
    expect(component.isMulti()).toBe(true);
    const subline: string = fixture.nativeElement.querySelector(
      '.pc__subline',
    ).textContent;
    expect(subline).toContain('across 3 locations');
  });

  it('does not toggle expanded state for a single-holding Position', () => {
    const inst = makeInstrument('AAPL');
    component.position = makePosition([makeHolding(inst)]);
    fixture.detectChanges();

    expect(component.expanded()).toBe(false);
    component.toggle();
    expect(component.expanded()).toBe(false);
  });

  it('toggles expanded state for a multi-holding Position', () => {
    const inst = makeInstrument('BTC', AssetClass.CRYPTO);
    component.position = makePosition([
      makeHolding(inst),
      makeHolding(inst),
    ]);
    fixture.detectChanges();

    expect(component.expanded()).toBe(false);
    component.toggle();
    expect(component.expanded()).toBe(true);
    component.toggle();
    expect(component.expanded()).toBe(false);
  });

  it('renders one position-row per holding when expanded', () => {
    const inst = makeInstrument('BTC', AssetClass.CRYPTO);
    component.position = makePosition([
      makeHolding(inst, { id: 'h1' }),
      makeHolding(inst, { id: 'h2' }),
      makeHolding(inst, { id: 'h3' }),
    ]);
    fixture.detectChanges();
    component.toggle();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('pgz-position-row');
    expect(rows.length).toBe(3);
  });

  it('applies the subcard surface variant when variant="subcard"', () => {
    const inst = makeInstrument('AAPL');
    component.position = makePosition([makeHolding(inst)]);
    component.variant = 'subcard';
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.pc');
    expect(root.classList.contains('pc--subcard')).toBe(true);
  });
});
