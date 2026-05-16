import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { IPortfolioCrypto, IPortfolioStock } from '../../../domain/savings.domain';
import { HoldingMapper, MANUAL_ACCOUNT_ID } from './HoldingMapper';

describe('HoldingMapper.fromIAsset', () => {
  it('produces a Holding with quantity and avg buy price from IAsset', () => {
    const asset = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'Stock',
      price: 175,
      count: 10,
      buyPrice: 140,
    };
    const instruments = new Map<string, IInstrument>();

    const holding = HoldingMapper.fromIAsset(asset, instruments);

    expect(holding.quantity).toBe(10);
    expect(holding.averageBuyPrice).toBe(140);
    expect(holding.tagIds).toEqual([]);
    expect(holding.accountId).toBe(MANUAL_ACCOUNT_ID);
    expect(holding.instrumentId).toBeTruthy();
    expect(holding.createdAt).toBeTruthy();
    expect(holding.updatedAt).toBeTruthy();
  });

  it('falls back to `price` when `buyPrice` is missing', () => {
    const asset = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'Stock',
      price: 175,
      count: 10,
    };
    const instruments = new Map<string, IInstrument>();

    const holding = HoldingMapper.fromIAsset(asset, instruments);

    expect(holding.averageBuyPrice).toBe(175);
  });

  it('defaults quantity to 0 when count is missing', () => {
    const asset = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'Stock',
      price: 175,
    };
    const instruments = new Map<string, IInstrument>();

    const holding = HoldingMapper.fromIAsset(asset, instruments);

    expect(holding.quantity).toBe(0);
  });

  it('auto-derives a STOCK Instrument when none exists for that symbol', () => {
    const asset = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'Stock',
      price: 175,
    };
    const instruments = new Map<string, IInstrument>();

    const holding = HoldingMapper.fromIAsset(asset, instruments);

    expect(instruments.size).toBe(1);
    const instrument = instruments.get(holding.instrumentId);
    expect(instrument).toBeDefined();
    expect(instrument!.symbol).toBe('AAPL');
    expect(instrument!.assetClass).toBe(AssetClass.STOCK);
    expect(instrument!.createdBy).toBe('system');
    expect(instrument!.metadata.kind).toBe(AssetClass.STOCK);
  });

  it('auto-derives a CRYPTO Instrument when assetType is "Crypto"', () => {
    const asset = {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      assetType: 'Crypto',
      price: 60000,
      count: 0.5,
      buyPrice: 55000,
    };
    const instruments = new Map<string, IInstrument>();

    const holding = HoldingMapper.fromIAsset(asset, instruments);

    const instrument = instruments.get(holding.instrumentId);
    expect(instrument!.assetClass).toBe(AssetClass.CRYPTO);
    expect(instrument!.metadata.kind).toBe(AssetClass.CRYPTO);
    if (instrument!.metadata.kind === AssetClass.CRYPTO) {
      expect(instrument!.metadata.coinId).toBe('bitcoin');
    }
  });

  it('reuses an existing Instrument for the same symbol+assetClass', () => {
    const existingId = 'existing-instrument';
    const instruments = new Map<string, IInstrument>();
    instruments.set(existingId, {
      id: existingId,
      assetClass: AssetClass.STOCK,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currency: 'USD',
      metadata: { kind: AssetClass.STOCK, exchange: 'NASDAQ', currency: 'USD' },
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    });

    const asset = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'Stock',
      price: 175,
    };

    const holding = HoldingMapper.fromIAsset(asset, instruments);

    expect(holding.instrumentId).toBe(existingId);
    expect(instruments.size).toBe(1);
  });

  it('does not reuse an instrument with same symbol but different assetClass', () => {
    const stockId = 'stock-aapl';
    const instruments = new Map<string, IInstrument>();
    instruments.set(stockId, {
      id: stockId,
      assetClass: AssetClass.STOCK,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currency: 'USD',
      metadata: { kind: AssetClass.STOCK, exchange: 'NASDAQ', currency: 'USD' },
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    });

    const cryptoAsset = {
      id: 'aapl-token',
      symbol: 'AAPL',
      name: 'AAPL Token',
      assetType: 'Crypto',
      price: 175,
    };

    const holding = HoldingMapper.fromIAsset(cryptoAsset, instruments);

    expect(holding.instrumentId).not.toBe(stockId);
    expect(instruments.size).toBe(2);
  });

  it('preserves sector and dividendYield from IPortfolioStock when deriving', () => {
    const asset: IPortfolioStock = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'Stock',
      price: 175,
      currency: 'USD',
      sector: 'Technology',
      dividendYield: 0.005,
    };
    const instruments = new Map<string, IInstrument>();

    const holding = HoldingMapper.fromIAsset(asset, instruments);
    const instrument = instruments.get(holding.instrumentId)!;

    if (instrument.metadata.kind === AssetClass.STOCK) {
      expect(instrument.metadata.sector).toBe('Technology');
      expect(instrument.metadata.dividendYield).toBe(0.005);
    } else {
      fail('expected STOCK metadata');
    }
  });
});

describe('HoldingMapper.toIAsset', () => {
  it('round-trips IAsset -> IHolding -> IAsset preserving symbol and count for STOCK', () => {
    const original: IPortfolioStock = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'Stock',
      price: 175,
      count: 10,
      buyPrice: 140,
      currency: 'USD',
      sector: 'Technology',
      dividendYield: 0.005,
    };
    const instruments = new Map<string, IInstrument>();

    const holding = HoldingMapper.fromIAsset(original, instruments);
    const instrument = instruments.get(holding.instrumentId)!;
    const back = HoldingMapper.toIAsset(holding, instrument) as IPortfolioStock;

    expect(back.symbol).toBe('AAPL');
    expect(back.name).toBe('Apple Inc.');
    expect(back.count).toBe(10);
    expect(back.buyPrice).toBe(140);
    expect(back.assetType).toBe('Stock');
    expect(back.currency).toBe('USD');
    expect(back.sector).toBe('Technology');
    expect(back.dividendYield).toBe(0.005);
  });

  it('produces IPortfolioCrypto-shaped output for CRYPTO instruments', () => {
    const original: IPortfolioCrypto = {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      assetType: 'Crypto',
      price: 60000,
      count: 0.5,
      buyPrice: 55000,
    };
    const instruments = new Map<string, IInstrument>();

    const holding = HoldingMapper.fromIAsset(original, instruments);
    const instrument = instruments.get(holding.instrumentId)!;
    const back = HoldingMapper.toIAsset(holding, instrument) as IPortfolioCrypto;

    expect(back.id).toBe('bitcoin');
    expect(back.symbol).toBe('BTC');
    expect(back.assetType).toBe('Crypto');
    expect(back.count).toBe(0.5);
    expect(back.buyPrice).toBe(55000);
  });

  it('falls back to bare IAsset for non-stock/non-crypto classes', () => {
    const instruments = new Map<string, IInstrument>();
    const now = new Date().toISOString();
    instruments.set('cash-usd', {
      id: 'cash-usd',
      assetClass: AssetClass.CASH,
      symbol: 'USD',
      name: 'USD Cash',
      currency: 'USD',
      metadata: { kind: AssetClass.CASH, currency: 'USD' },
      createdBy: 'user',
      createdAt: now,
    });

    const holding: IHolding = {
      id: 'h1',
      instrumentId: 'cash-usd',
      accountId: MANUAL_ACCOUNT_ID,
      quantity: 5000,
      averageBuyPrice: 1,
      currency: 'USD',
      tagIds: [],
      createdAt: now,
      updatedAt: now,
    };

    const back = HoldingMapper.toIAsset(holding, instruments.get('cash-usd')!);

    expect(back.symbol).toBe('USD');
    expect(back.count).toBe(5000);
    expect(back.assetType).toBe('CASH');
    // No IPortfolioStock-only fields should leak through.
    expect((back as IPortfolioStock).sector).toBeUndefined();
  });
});
