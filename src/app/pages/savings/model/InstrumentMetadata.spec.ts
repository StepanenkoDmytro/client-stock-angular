import { AssetClass } from '../../../domain/asset-class.domain';
import {
  defaultMetadataFor,
  isCashMetadata,
  isCryptoMetadata,
  isDepositMetadata,
  isOtherMetadata,
  isRealEstateMetadata,
  isStockMetadata,
  isTokenizedStockMetadata,
} from './InstrumentMetadata';

describe('InstrumentMetadata type guards', () => {
  it('isStockMetadata returns true only for STOCK kind', () => {
    expect(
      isStockMetadata({ kind: AssetClass.STOCK, exchange: 'NYSE', currency: 'USD' }),
    ).toBe(true);
    expect(isStockMetadata({ kind: AssetClass.CRYPTO, coinId: 'btc' })).toBe(false);
  });

  it('isTokenizedStockMetadata returns true only for TOKENIZED_STOCK kind', () => {
    expect(
      isTokenizedStockMetadata({
        kind: AssetClass.TOKENIZED_STOCK,
        underlyingSymbol: 'AAPL',
        tokenSymbol: 'AAPL.X',
        exchange: 'NASDAQ',
        blockchain: 'eth',
      }),
    ).toBe(true);
    expect(
      isTokenizedStockMetadata({ kind: AssetClass.STOCK, exchange: 'NYSE', currency: 'USD' }),
    ).toBe(false);
  });

  it('isCryptoMetadata returns true only for CRYPTO kind', () => {
    expect(isCryptoMetadata({ kind: AssetClass.CRYPTO, coinId: 'btc' })).toBe(true);
    expect(isCryptoMetadata({ kind: AssetClass.CASH, currency: 'USD' })).toBe(false);
  });

  it('isCashMetadata returns true only for CASH kind', () => {
    expect(isCashMetadata({ kind: AssetClass.CASH, currency: 'USD' })).toBe(true);
    expect(isCashMetadata({ kind: AssetClass.OTHER, currency: 'USD' })).toBe(false);
  });

  it('isDepositMetadata returns true only for DEPOSIT kind', () => {
    expect(
      isDepositMetadata({ kind: AssetClass.DEPOSIT, currency: 'USD', interestRate: 5 }),
    ).toBe(true);
    expect(
      isDepositMetadata({ kind: AssetClass.REAL_ESTATE, currency: 'USD' }),
    ).toBe(false);
  });

  it('isRealEstateMetadata returns true only for REAL_ESTATE kind', () => {
    expect(
      isRealEstateMetadata({ kind: AssetClass.REAL_ESTATE, currency: 'EUR' }),
    ).toBe(true);
    expect(
      isRealEstateMetadata({ kind: AssetClass.OTHER, currency: 'EUR' }),
    ).toBe(false);
  });

  it('isOtherMetadata returns true only for OTHER kind', () => {
    expect(isOtherMetadata({ kind: AssetClass.OTHER, currency: 'USD' })).toBe(true);
    expect(
      isOtherMetadata({ kind: AssetClass.STOCK, exchange: 'NYSE', currency: 'USD' }),
    ).toBe(false);
  });
});

describe('defaultMetadataFor', () => {
  it('returns metadata with matching kind for each AssetClass', () => {
    const classes = [
      AssetClass.STOCK,
      AssetClass.TOKENIZED_STOCK,
      AssetClass.CRYPTO,
      AssetClass.CASH,
      AssetClass.DEPOSIT,
      AssetClass.REAL_ESTATE,
      AssetClass.OTHER,
    ];
    for (const ac of classes) {
      const m = defaultMetadataFor(ac);
      expect(m.kind).toBe(ac);
    }
  });

  it('uses provided currency for currency-bearing variants', () => {
    expect((defaultMetadataFor(AssetClass.CASH, 'UAH') as any).currency).toBe('UAH');
    expect((defaultMetadataFor(AssetClass.DEPOSIT, 'EUR') as any).currency).toBe('EUR');
    expect((defaultMetadataFor(AssetClass.REAL_ESTATE, 'PLN') as any).currency).toBe('PLN');
    expect((defaultMetadataFor(AssetClass.OTHER, 'JPY') as any).currency).toBe('JPY');
    expect((defaultMetadataFor(AssetClass.STOCK, 'USD') as any).currency).toBe('USD');
  });

  it('defaults currency to USD when omitted', () => {
    expect((defaultMetadataFor(AssetClass.CASH) as any).currency).toBe('USD');
  });

  it('initializes DEPOSIT.interestRate to 0', () => {
    const m = defaultMetadataFor(AssetClass.DEPOSIT, 'USD');
    if (m.kind === AssetClass.DEPOSIT) {
      expect(m.interestRate).toBe(0);
    } else {
      fail('expected DEPOSIT metadata');
    }
  });
});
