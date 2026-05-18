import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetClass } from '../../../../../../domain/asset-class.domain';
import { ADD_HOLDING_CLASS_CARDS } from '../../../../model/AddHoldingArchetype';
import { ClassChipBreadcrumbComponent } from './class-chip-breadcrumb.component';

describe('ClassChipBreadcrumbComponent', () => {
  let fixture: ComponentFixture<ClassChipBreadcrumbComponent>;
  let component: ClassChipBreadcrumbComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassChipBreadcrumbComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ClassChipBreadcrumbComponent);
    component = fixture.componentInstance;
  });

  it('resolves card metadata for each AssetClass via the shared registry', () => {
    for (const card of ADD_HOLDING_CLASS_CARDS) {
      component.assetClass = card.assetClass;
      fixture.detectChanges();

      expect(component.label()).toBe(card.label);
      expect(component.icon()).toBe(card.icon);
      expect(component.tintVar()).toBe(card.tintVar);
    }
  });

  it('falls back to safe defaults for an unknown class (defensive)', () => {
    // Subclasses of AssetClass don't exist, but the component shouldn't
    // crash if the input is set to something with no registered card.
    component.assetClass = 'UNKNOWN' as unknown as AssetClass;
    fixture.detectChanges();

    expect(component.label()).toBe('');
    expect(component.icon()).toBe('');
    expect(component.tintVar()).toBe('--pgz-card-border');
  });

  it('onChange emits changeRequested', () => {
    let emitted = false;
    component.changeRequested.subscribe(() => (emitted = true));

    component.onChange();

    expect(emitted).toBeTrue();
  });
});
