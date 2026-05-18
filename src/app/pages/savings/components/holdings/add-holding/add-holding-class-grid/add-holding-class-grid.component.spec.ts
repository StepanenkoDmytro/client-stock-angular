import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { AssetClass } from '../../../../../../domain/asset-class.domain';
import {
  ADD_HOLDING_CLASS_CARDS,
  FUTURE_CLASS_CARDS,
} from '../../../../model/AddHoldingArchetype';
import { AddHoldingClassGridComponent } from './add-holding-class-grid.component';

describe('AddHoldingClassGridComponent', () => {
  let fixture: ComponentFixture<AddHoldingClassGridComponent>;
  let component: AddHoldingClassGridComponent;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [AddHoldingClassGridComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddHoldingClassGridComponent);
    component = fixture.componentInstance;
  });

  it('exposes the canonical set of cards from AddHoldingArchetype', () => {
    expect(component.cards).toBe(ADD_HOLDING_CLASS_CARDS);
    expect(component.future).toBe(FUTURE_CLASS_CARDS);
  });

  it('onPick emits classPicked and navigates to the slug-form route', () => {
    let emitted: AssetClass | null = null;
    component.classPicked.subscribe((c) => (emitted = c));

    component.onPick(AssetClass.STOCK);

    expect(emitted).toBe(AssetClass.STOCK);
    expect(router.navigate).toHaveBeenCalledWith(['/savings/add-holding', 'stock']);
  });

  it('onPickFuture opens a snackbar and does NOT navigate', () => {
    component.onPickFuture('Bonds');

    expect(snackBar.open).toHaveBeenCalled();
    const [message] = snackBar.open.calls.mostRecent().args;
    expect(message).toContain('Bonds');
    expect(message).toContain('coming');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('goBack navigates to /savings', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/savings']);
  });
});
