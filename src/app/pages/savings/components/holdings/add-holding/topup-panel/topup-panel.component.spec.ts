import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopupPanelComponent } from './topup-panel.component';

describe('TopupPanelComponent', () => {
  let fixture: ComponentFixture<TopupPanelComponent>;
  let component: TopupPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopupPanelComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(TopupPanelComponent);
    component = fixture.componentInstance;
    component.currentQuantity = 10;
    component.currentAveragePrice = 100;
    component.currency = 'USD';
    fixture.detectChanges();
  });

  it('starts with canSubmit=false (no values yet)', () => {
    expect(component.canSubmit()).toBe(false);
    expect(component.previewAveragePrice()).toBeNull();
  });

  it('computes weighted-average preview: 10@100 + 5@200 → 15 @ 133.33', () => {
    component.form.patchValue({ addQuantity: 5, addBuyPrice: 200 });
    expect(component.previewQuantity()).toBe(15);
    expect(component.previewAveragePrice()).toBeCloseTo(133.3333, 4);
    expect(component.canSubmit()).toBe(true);
  });

  it('uses addBuyPrice as average when currentQuantity is 0 (sold-out re-open)', () => {
    component.currentQuantity = 0;
    component.currentAveragePrice = 0;
    component.form.patchValue({ addQuantity: 3, addBuyPrice: 250 });
    expect(component.previewAveragePrice()).toBe(250);
    expect(component.previewQuantity()).toBe(3);
  });

  it('rejects non-positive inputs (preview stays null)', () => {
    component.form.patchValue({ addQuantity: 0, addBuyPrice: 100 });
    expect(component.previewAveragePrice()).toBeNull();
    expect(component.canSubmit()).toBe(false);

    component.form.patchValue({ addQuantity: 5, addBuyPrice: -1 });
    expect(component.previewAveragePrice()).toBeNull();
    expect(component.canSubmit()).toBe(false);
  });

  it('emits submission on Apply when valid and resets the form', () => {
    let emitted: { addQuantity: number; addBuyPrice: number } | null = null;
    component.submitted.subscribe((p) => (emitted = p));
    component.form.patchValue({ addQuantity: 2, addBuyPrice: 150 });

    component.onApply();

    expect(emitted).toEqual({ addQuantity: 2, addBuyPrice: 150 });
    expect(component.form.get('addQuantity')?.value).toBeNull();
    expect(component.form.get('addBuyPrice')?.value).toBeNull();
  });

  it('does not emit when invalid', () => {
    let emitted = false;
    component.submitted.subscribe(() => (emitted = true));
    component.onApply();
    expect(emitted).toBe(false);
  });
});
