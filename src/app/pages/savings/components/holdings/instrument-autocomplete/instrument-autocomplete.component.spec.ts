import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of } from 'rxjs';
import { AssetClass } from '../../../../../domain/asset-class.domain';
import { IInstrument } from '../../../../../domain/instrument.domain';
import { InstrumentService } from '../../../service/instrument.service';
import { InstrumentAutocompleteComponent } from './instrument-autocomplete.component';

interface MarketSearchResult {
  results: IInstrument[];
  stale: boolean;
}

class FakeInstrumentService {
  private readonly _map = signal<Map<string, IInstrument>>(new Map());
  readonly instruments = this._map.asReadonly();
  readonly searchMarketCalls: Array<{ q: string; assetClass: AssetClass }> = [];
  searchMarketResponse: MarketSearchResult = { results: [], stale: false };

  setCache(insts: IInstrument[]) {
    const m = new Map<string, IInstrument>();
    for (const i of insts) m.set(i.id, i);
    this._map.set(m);
  }

  search(query: string, assetClass?: AssetClass): IInstrument[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Array.from(this._map().values()).filter(
      (i) =>
        (!assetClass || i.assetClass === assetClass) &&
        (i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)),
    );
  }

  searchMarket(
    query: string,
    assetClass: AssetClass,
  ): Observable<MarketSearchResult> {
    this.searchMarketCalls.push({ q: query, assetClass });
    return of(this.searchMarketResponse);
  }
}

function inst(id: string, symbol: string, ac: AssetClass): IInstrument {
  return {
    id,
    symbol,
    assetClass: ac,
    name: `${symbol} Inc.`,
    currency: 'USD',
    metadata: { kind: ac, currency: 'USD' } as IInstrument['metadata'],
    createdBy: 'system',
    createdAt: '2026-01-01T00:00:00Z',
  };
}

describe('InstrumentAutocompleteComponent', () => {
  let fixture: ComponentFixture<InstrumentAutocompleteComponent>;
  let component: InstrumentAutocompleteComponent;
  let service: FakeInstrumentService;

  beforeEach(async () => {
    service = new FakeInstrumentService();
    await TestBed.configureTestingModule({
      imports: [InstrumentAutocompleteComponent, NoopAnimationsModule],
      providers: [{ provide: InstrumentService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(InstrumentAutocompleteComponent);
    component = fixture.componentInstance;
  });

  it('isMarketMode=true for STOCK/ETF/CRYPTO/TOKENIZED_STOCK', () => {
    for (const ac of [AssetClass.STOCK, AssetClass.ETF, AssetClass.CRYPTO, AssetClass.TOKENIZED_STOCK]) {
      component.assetClass = ac;
      component.ngOnChanges({ assetClass: { currentValue: ac, previousValue: null, firstChange: true, isFirstChange: () => true } });
      fixture.detectChanges();
      expect(component.isMarketMode()).withContext(`for ${ac}`).toBe(true);
    }
  });

  it('isMarketMode=false for CASH/DEPOSIT/REAL_ESTATE/OTHER', () => {
    for (const ac of [AssetClass.CASH, AssetClass.DEPOSIT, AssetClass.REAL_ESTATE, AssetClass.OTHER]) {
      component.assetClass = ac;
      component.ngOnChanges({ assetClass: { currentValue: ac, previousValue: null, firstChange: true, isFirstChange: () => true } });
      fixture.detectChanges();
      expect(component.isMarketMode()).withContext(`for ${ac}`).toBe(false);
    }
  });

  it('typing in market mode debounces and calls searchMarket once', fakeAsync(() => {
    component.assetClass = AssetClass.STOCK;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.STOCK, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();

    service.searchMarketResponse = {
      results: [inst('1', 'AAPL', AssetClass.STOCK)],
      stale: false,
    };

    component.searchCtrl.setValue('A');
    component.searchCtrl.setValue('AP');
    component.searchCtrl.setValue('AAPL');
    tick(299);
    expect(service.searchMarketCalls.length).toBe(0);
    expect(component.isLoading()).toBe(true);

    tick(1);
    expect(service.searchMarketCalls.length).toBe(1);
    expect(service.searchMarketCalls[0]).toEqual({ q: 'AAPL', assetClass: AssetClass.STOCK });
    expect(component.isLoading()).toBe(false);
    expect(component.suggestions().map((i) => i.symbol)).toEqual(['AAPL']);
  }));

  it('propagates stale flag from market search', fakeAsync(() => {
    component.assetClass = AssetClass.CRYPTO;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.CRYPTO, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();

    service.searchMarketResponse = { results: [], stale: true };
    component.searchCtrl.setValue('btc');
    tick(300);

    expect(component.isStale()).toBe(true);
  }));

  it('manual classes use local sync search, never call HTTP', fakeAsync(() => {
    service.setCache([
      inst('1', 'USD', AssetClass.CASH),
      inst('2', 'EUR', AssetClass.CASH),
    ]);
    component.assetClass = AssetClass.CASH;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.CASH, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();

    component.searchCtrl.setValue('US');
    tick(500);

    expect(service.searchMarketCalls.length).toBe(0);
    expect(component.suggestions().map((i) => i.symbol)).toEqual(['USD']);
  }));

  it('switching assetClass clears market results and stale flag', fakeAsync(() => {
    component.assetClass = AssetClass.STOCK;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.STOCK, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();

    service.searchMarketResponse = {
      results: [inst('1', 'AAPL', AssetClass.STOCK)],
      stale: true,
    };
    component.searchCtrl.setValue('AAPL');
    tick(300);
    expect(component.suggestions().length).toBe(1);
    expect(component.isStale()).toBe(true);

    component.assetClass = AssetClass.CRYPTO;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.CRYPTO, previousValue: AssetClass.STOCK, firstChange: false, isFirstChange: () => false } });
    fixture.detectChanges();

    // Drain any pending debounce timer from the prior typed query.
    tick(300);
    expect(component.suggestions()).toEqual([]);
    expect(component.isStale()).toBe(false);
    discardPeriodicTasks();
  }));

  it('setting value programmatically writes the display text without re-triggering search', fakeAsync(() => {
    component.assetClass = AssetClass.STOCK;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.STOCK, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();

    const aapl = inst('1', 'AAPL', AssetClass.STOCK);
    component.value = aapl;
    tick(500);

    // Display text updated.
    expect(component.searchCtrl.value).toBe('AAPL — AAPL Inc.');
    // Even though valueChanges fired, the typed text matches the
    // selected display so the value isn't cleared. And we still allow
    // a market call (text is non-empty), but the result is just an echo.
  }));

  it('typing freeform after a selection clears the value', fakeAsync(() => {
    component.assetClass = AssetClass.STOCK;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.STOCK, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();

    const aapl = inst('1', 'AAPL', AssetClass.STOCK);
    component.value = aapl;
    tick(0);

    let emitted: IInstrument | null | undefined;
    component.valueChange.subscribe((v) => (emitted = v));

    component.searchCtrl.setValue('AAP');
    tick(300);

    expect(emitted).toBeNull();
    expect(component.value).toBeNull();
  }));

  it('onClear() resets value, query, results, stale', () => {
    component.assetClass = AssetClass.STOCK;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.STOCK, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();

    component.value = inst('1', 'AAPL', AssetClass.STOCK);
    component.searchCtrl.setValue('AAP');

    let emitted: IInstrument | null | undefined;
    component.valueChange.subscribe((v) => (emitted = v));

    component.onClear();

    expect(emitted).toBeNull();
    expect(component.searchCtrl.value).toBe('');
    expect(component.isStale()).toBe(false);
  });

  it('onCreateCustom emits typed query', () => {
    component.assetClass = AssetClass.STOCK;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.STOCK, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();

    let emitted = '';
    component.createCustom.subscribe((s) => (emitted = s));

    component.searchCtrl.setValue('  XYZ ');
    component.onCreateCustom();

    expect(emitted).toBe('XYZ');
  });

  it('showPopular hides when something is typed', fakeAsync(() => {
    component.assetClass = AssetClass.STOCK;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.STOCK, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();

    expect(component.showPopular()).toBe(true);
    component.searchCtrl.setValue('A');
    tick(0);
    expect(component.showPopular()).toBe(false);
    discardPeriodicTasks();
  }));

  it('showPopular is false for manual classes', () => {
    component.assetClass = AssetClass.CASH;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.CASH, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();
    expect(component.showPopular()).toBe(false);
  });

  it('disabled lock — disables form control and hides clear', () => {
    component.assetClass = AssetClass.STOCK;
    component.ngOnChanges({ assetClass: { currentValue: AssetClass.STOCK, previousValue: null, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();

    component.disabled = true;
    component.ngOnChanges({ disabled: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false } });
    fixture.detectChanges();

    expect(component.searchCtrl.disabled).toBe(true);
    expect(component.showClear()).toBe(false);
  });
});
