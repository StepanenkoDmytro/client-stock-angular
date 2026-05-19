import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AssetClass } from '../../../../../../domain/asset-class.domain';
import { NetworkStatusService } from '../../../../../../core/network/network-status.service';
import {
  ADD_HOLDING_CLASS_CARDS,
  FUTURE_CLASS_CARDS,
} from '../../../../model/AddHoldingArchetype';
import { AddHoldingClassGridComponent } from './add-holding-class-grid.component';

class FakeNetworkStatusService {
  private readonly _online = signal(true);
  readonly online = this._online.asReadonly();
  setOnline(value: boolean): void {
    this._online.set(value);
  }
  recheck(): void {
    // no-op in tests; setOnline drives the signal directly.
  }
}

describe('AddHoldingClassGridComponent', () => {
  let fixture: ComponentFixture<AddHoldingClassGridComponent>;
  let component: AddHoldingClassGridComponent;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let network: FakeNetworkStatusService;

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    network = new FakeNetworkStatusService();

    await TestBed.configureTestingModule({
      imports: [AddHoldingClassGridComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: NetworkStatusService, useValue: network },
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

  it('isCardDisabled is false online for every card', () => {
    network.setOnline(true);
    for (const card of ADD_HOLDING_CLASS_CARDS) {
      expect(component.isCardDisabled(card.assetClass)).toBeFalse();
    }
  });

  it('isCardDisabled flips market-backed cards offline, leaves manual alone', () => {
    network.setOnline(false);
    expect(component.isCardDisabled(AssetClass.STOCK)).toBeTrue();
    expect(component.isCardDisabled(AssetClass.CRYPTO)).toBeTrue();
    expect(component.isCardDisabled(AssetClass.ETF)).toBeTrue();
    expect(component.isCardDisabled(AssetClass.TOKENIZED_STOCK)).toBeTrue();
    expect(component.isCardDisabled(AssetClass.CASH)).toBeFalse();
    expect(component.isCardDisabled(AssetClass.DEPOSIT)).toBeFalse();
    expect(component.isCardDisabled(AssetClass.REAL_ESTATE)).toBeFalse();
    expect(component.isCardDisabled(AssetClass.OTHER)).toBeFalse();
  });

  it('onPick on a disabled market-backed card shows snackbar and does not navigate', () => {
    network.setOnline(false);
    let emitted: AssetClass | null = null;
    component.classPicked.subscribe((c) => (emitted = c));

    component.onPick(AssetClass.STOCK);

    expect(snackBar.open).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(emitted).toBeNull();
  });

  it('onPick on a manual card still works offline', () => {
    network.setOnline(false);
    component.onPick(AssetClass.CASH);
    expect(router.navigate).toHaveBeenCalledWith(['/savings/add-holding', 'cash']);
  });
});
