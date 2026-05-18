import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountKind } from '../../../../../../domain/account-kind.domain';
import { IHoldingLockMeta } from '../../../../../../domain/holding.domain';
import { AccountEarnBlockComponent } from './account-earn-block.component';

describe('AccountEarnBlockComponent', () => {
  let fixture: ComponentFixture<AccountEarnBlockComponent>;
  let component: AccountEarnBlockComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountEarnBlockComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AccountEarnBlockComponent);
    component = fixture.componentInstance;
  });

  describe('visibility', () => {
    it('hidden when accountKind is null', () => {
      component.accountKind = null;
      fixture.detectChanges();
      expect(component.visible()).toBeFalse();
    });

    it('hidden for MANUAL / spot kinds', () => {
      for (const kind of ['MANUAL', 'EXCHANGE_SPOT', 'WALLET_COLD'] as AccountKind[]) {
        component.accountKind = kind;
        expect(component.visible()).withContext(kind).toBeFalse();
      }
    });

    it('visible for earn / savings / deposit kinds', () => {
      for (const kind of [
        'EXCHANGE_EARN',
        'BANK_DEPOSIT',
        'BANK_SAVINGS',
      ] as AccountKind[]) {
        component.accountKind = kind;
        expect(component.visible()).withContext(kind).toBeTrue();
      }
    });
  });

  describe('ControlValueAccessor round-trip', () => {
    it('writeValue STAKING populates APR + lock days from period string', () => {
      const value: IHoldingLockMeta = {
        kind: 'STAKING',
        apr: 5,
        lockPeriod: '30-day lock',
      };
      component.writeValue(value);

      expect(component.apr()).toBe(5);
      expect(component.lockDays()).toBe(30);
    });

    it('writeValue FLEXIBLE populates APR only', () => {
      component.writeValue({ kind: 'FLEXIBLE', apr: 4 });

      expect(component.apr()).toBe(4);
      expect(component.lockDays()).toBeNull();
    });

    it('writeValue null clears both fields', () => {
      component.apr.set(7);
      component.lockDays.set(30);

      component.writeValue(null);

      expect(component.apr()).toBeNull();
      expect(component.lockDays()).toBeNull();
    });
  });

  describe('emits via onChange', () => {
    let captured: IHoldingLockMeta | null | undefined;

    beforeEach(() => {
      captured = undefined;
      component.registerOnChange((v) => (captured = v));
    });

    it('APR=0 / null emits null (no earn)', () => {
      component.onAprInput('');
      expect(captured).toBeNull();
    });

    it('APR>0 with no lock → FLEXIBLE', () => {
      component.onAprInput('5');
      expect(captured).toEqual({ kind: 'FLEXIBLE', apr: 5 });
    });

    it('APR>0 with lock → STAKING with formatted period', () => {
      component.onAprInput('6');
      component.onLockChange(30);
      expect(captured).toEqual({
        kind: 'STAKING',
        apr: 6,
        lockPeriod: '30-day lock',
      });
    });

    it('clearing lock back to null → FLEXIBLE', () => {
      component.onAprInput('5');
      component.onLockChange(7);
      component.onLockChange(null);
      expect(captured).toEqual({ kind: 'FLEXIBLE', apr: 5 });
    });
  });
});
