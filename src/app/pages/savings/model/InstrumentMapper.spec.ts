import { AssetClass } from '../../../domain/asset-class.domain';
import { ICoin, ICompany } from '../../../domain/savings.domain';
import { InstrumentMapper } from './InstrumentMapper';

describe('InstrumentMapper.fromICompany', () => {
  const sampleCompany: ICompany = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    assetType: 'Stock',
    price: 175,
    exchange: 'NASDAQ',
    currency: 'USD',
    country: 'US',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    marketCapitalization: 3_000_000_000_000,
    dividendYield: 0.005,
    dividendDate: '2026-08-15',
    exDividendDate: '2026-08-10',
  };

  it('maps to STOCK assetClass', () => {
    const inst = InstrumentMapper.fromICompany(sampleCompany);
    expect(inst.assetClass).toBe(AssetClass.STOCK);
  });

  it('produces StockMetadata kind', () => {
    const inst = InstrumentMapper.fromICompany(sampleCompany);
    expect(inst.metadata.kind).toBe(AssetClass.STOCK);
  });

  it('carries over exchange, country, sector, industry, dividendYield', () => {
    const inst = InstrumentMapper.fromICompany(sampleCompany);
    if (inst.metadata.kind === AssetClass.STOCK) {
      expect(inst.metadata.exchange).toBe('NASDAQ');
      expect(inst.metadata.country).toBe('US');
      expect(inst.metadata.sector).toBe('Technology');
      expect(inst.metadata.industry).toBe('Consumer Electronics');
      expect(inst.metadata.dividendYield).toBe(0.005);
    } else {
      fail('expected STOCK metadata');
    }
  });

  it('preserves symbol and name', () => {
    const inst = InstrumentMapper.fromICompany(sampleCompany);
    expect(inst.symbol).toBe('AAPL');
    expect(inst.name).toBe('Apple Inc.');
  });

  it('marks as system-created with UUID id and ISO createdAt', () => {
    const inst = InstrumentMapper.fromICompany(sampleCompany);
    expect(inst.createdBy).toBe('system');
    expect(inst.id).toBeTruthy();
    expect(inst.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('defaults currency to USD when missing', () => {
    const noCurrency = { ...sampleCompany, currency: '' };
    const inst = InstrumentMapper.fromICompany(noCurrency);
    expect(inst.currency).toBe('USD');
  });
});

describe('InstrumentMapper.fromICoin', () => {
  const sampleCoin: ICoin = {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    assetType: 'Crypto',
    price: 60000,
    marketCapitalization: 1_200_000_000_000,
  };

  it('maps to CRYPTO assetClass', () => {
    const inst = InstrumentMapper.fromICoin(sampleCoin);
    expect(inst.assetClass).toBe(AssetClass.CRYPTO);
  });

  it('produces CryptoMetadata kind with coinId', () => {
    const inst = InstrumentMapper.fromICoin(sampleCoin);
    expect(inst.metadata.kind).toBe(AssetClass.CRYPTO);
    if (inst.metadata.kind === AssetClass.CRYPTO) {
      expect(inst.metadata.coinId).toBe('bitcoin');
    } else {
      fail('expected CRYPTO metadata');
    }
  });

  it('preserves symbol and name', () => {
    const inst = InstrumentMapper.fromICoin(sampleCoin);
    expect(inst.symbol).toBe('BTC');
    expect(inst.name).toBe('Bitcoin');
  });

  it('defaults currency to USD for crypto pricing', () => {
    const inst = InstrumentMapper.fromICoin(sampleCoin);
    expect(inst.currency).toBe('USD');
  });

  it('marks as system-created', () => {
    const inst = InstrumentMapper.fromICoin(sampleCoin);
    expect(inst.createdBy).toBe('system');
  });
});
