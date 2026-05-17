import { ACCOUNT_KINDS } from '../../../domain/account-kind.domain';
import { IHolding } from '../../../domain/holding.domain';
import {
  ACCOUNT_KIND_FLAGS,
  ACCOUNT_KIND_FLAGS_COVERAGE,
  accountKindOf,
} from './account-kind.const';

describe('account-kind.const', () => {
  describe('ACCOUNT_KIND_FLAGS', () => {
    it('has an entry for every AccountKind enum value', () => {
      for (const kind of ACCOUNT_KINDS) {
        expect(ACCOUNT_KIND_FLAGS[kind]).toBeDefined();
        const flag = ACCOUNT_KIND_FLAGS[kind];
        // colorVar must always resolve to a printable hex/CSS string
        expect(typeof flag.colorVar).toBe('string');
        expect(flag.colorVar.length).toBeGreaterThan(0);
      }
    });

    it('COVERAGE array stays in lock-step with ACCOUNT_KINDS', () => {
      expect(ACCOUNT_KIND_FLAGS_COVERAGE).toEqual(ACCOUNT_KINDS);
    });

    it('renders WALLET_COLD with the cold-storage glyph', () => {
      const flag = ACCOUNT_KIND_FLAGS.WALLET_COLD;
      expect(flag.icon).toBe('❄');
      expect(flag.label).toBe('Cold storage');
    });

    it('renders EXCHANGE_EARN with the earning glyph', () => {
      const flag = ACCOUNT_KIND_FLAGS.EXCHANGE_EARN;
      expect(flag.icon).toBe('⚡');
      expect(flag.label).toBe('Earning');
    });

    it('renders BANK_DEPOSIT with the locked glyph', () => {
      expect(ACCOUNT_KIND_FLAGS.BANK_DEPOSIT.icon).toBe('🔒');
    });

    it('renders MANUAL/WALLET_HOT as plain rows (no icon, no label)', () => {
      expect(ACCOUNT_KIND_FLAGS.MANUAL.icon).toBeNull();
      expect(ACCOUNT_KIND_FLAGS.MANUAL.label).toBeNull();
      expect(ACCOUNT_KIND_FLAGS.WALLET_HOT.icon).toBeNull();
    });
  });

  describe('accountKindOf', () => {
    it('returns the accountKind on the holding when present', () => {
      const h: Pick<IHolding, 'accountKind'> = { accountKind: 'EXCHANGE_EARN' };
      expect(accountKindOf(h)).toBe('EXCHANGE_EARN');
    });

    it('falls back to MANUAL when accountKind is missing', () => {
      const h: Pick<IHolding, 'accountKind'> = {};
      expect(accountKindOf(h)).toBe('MANUAL');
    });

    it('falls back to MANUAL when accountKind is explicitly undefined', () => {
      const h: Pick<IHolding, 'accountKind'> = { accountKind: undefined };
      expect(accountKindOf(h)).toBe('MANUAL');
    });
  });
});
