import { v4 as uuid } from 'uuid';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
import {
  IInstrument,
  InstrumentMetadata,
} from '../../../domain/instrument.domain';
import {
  IAsset,
  IPortfolioCrypto,
  IPortfolioStock,
} from '../../../domain/savings.domain';

/**
 * Default account id used until the Account UI lands. All manual holdings
 * land here. Mirrors the backend `AccountType.MANUAL` row that M2 PR3
 * introduces in `db.changelog-2.0.4`.
 */
export const MANUAL_ACCOUNT_ID = 'manual';

/**
 * HoldingMapper — bridge between the legacy IAsset model (still living in
 * localStorage under `'assets-list'`) and the new IHolding + IInstrument
 * model.
 *
 * Two directions:
 *
 *  - `fromIAsset(asset, instruments)` — backfill mapper used by
 *    `HoldingService.init()` on first launch to migrate the old snapshot to
 *    `'holdings-list'`. Auto-derives an IInstrument if none exists yet for
 *    the (symbol, assetClass) pair. **Mutates the instruments Map** to
 *    insert the derived instrument.
 *
 *  - `toIAsset(holding, instrument)` — back-compat output for the legacy
 *    screens (AssetCardComponent, dashboards, stock-asset/crypto-asset) that
 *    keep rendering IAsset shape until M5 rewrite. Picks the assetClass-
 *    specific subtype when it has the data.
 */
export class HoldingMapper {
  static fromIAsset(
    asset: IAsset,
    instruments: Map<string, IInstrument>,
  ): IHolding {
    const assetClass = HoldingMapper.assetClassFromIAsset(asset);
    const now = new Date().toISOString();

    let instrument = HoldingMapper.findInstrumentBySymbol(
      instruments,
      asset.symbol,
      assetClass,
    );

    if (!instrument) {
      instrument = HoldingMapper.deriveInstrument(asset, assetClass, now);
      instruments.set(instrument.id, instrument);
    }

    const buyPrice = asset.buyPrice ?? asset.price ?? 0;

    return {
      id: uuid(),
      instrumentId: instrument.id,
      accountId: MANUAL_ACCOUNT_ID,
      quantity: asset.count ?? 0,
      averageBuyPrice: buyPrice,
      currency: instrument.currency,
      tagIds: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  static toIAsset(
    holding: IHolding,
    instrument: IInstrument,
  ): IAsset | IPortfolioStock | IPortfolioCrypto {
    const base: IAsset = {
      symbol: instrument.symbol,
      name: instrument.name,
      assetType: HoldingMapper.assetTypeFromAssetClass(instrument.assetClass),
      price: holding.averageBuyPrice,
      count: holding.quantity,
      buyPrice: holding.averageBuyPrice,
    };

    if (
      instrument.assetClass === AssetClass.STOCK ||
      instrument.assetClass === AssetClass.TOKENIZED_STOCK
    ) {
      const m = instrument.metadata;
      const stock: IPortfolioStock = {
        ...base,
        currency: instrument.currency,
        sector: 'sector' in m && m.sector ? m.sector : '',
        dividendYield:
          'dividendYield' in m && m.dividendYield !== undefined
            ? m.dividendYield
            : 0,
      };
      return stock;
    }

    if (instrument.assetClass === AssetClass.CRYPTO) {
      const m = instrument.metadata;
      const crypto: IPortfolioCrypto = {
        ...base,
        id: 'coinId' in m ? m.coinId : instrument.symbol,
      };
      return crypto;
    }

    return base;
  }

  // -- helpers --

  private static assetClassFromIAsset(asset: IAsset): AssetClass {
    // Old IAsset.assetType is one of 'Stock' | 'Crypto' (free-form strings
    // per the legacy MarketService routing). Normalize to our enum.
    const t = (asset.assetType || '').toLowerCase();
    if (t === 'crypto') {
      return AssetClass.CRYPTO;
    }
    return AssetClass.STOCK;
  }

  private static assetTypeFromAssetClass(assetClass: AssetClass): string {
    if (assetClass === AssetClass.CRYPTO) {
      return 'Crypto';
    }
    if (
      assetClass === AssetClass.STOCK ||
      assetClass === AssetClass.TOKENIZED_STOCK
    ) {
      return 'Stock';
    }
    // For new classes, keep the enum string as the UI label fallback.
    return assetClass;
  }

  private static findInstrumentBySymbol(
    instruments: Map<string, IInstrument>,
    symbol: string,
    assetClass: AssetClass,
  ): IInstrument | undefined {
    for (const i of instruments.values()) {
      if (i.symbol === symbol && i.assetClass === assetClass) {
        return i;
      }
    }
    return undefined;
  }

  private static deriveInstrument(
    asset: IAsset,
    assetClass: AssetClass,
    now: string,
  ): IInstrument {
    const portfolioStock = asset as Partial<IPortfolioStock>;
    const portfolioCrypto = asset as Partial<IPortfolioCrypto>;
    const currency = portfolioStock.currency || 'USD';

    let metadata: InstrumentMetadata;
    if (assetClass === AssetClass.CRYPTO) {
      metadata = {
        kind: AssetClass.CRYPTO,
        coinId: portfolioCrypto.id || asset.symbol.toLowerCase(),
      };
    } else {
      metadata = {
        kind: AssetClass.STOCK,
        exchange: '',
        currency,
        sector: portfolioStock.sector || undefined,
        dividendYield: portfolioStock.dividendYield ?? undefined,
      };
    }

    return {
      id: uuid(),
      assetClass,
      symbol: asset.symbol,
      name: asset.name,
      currency,
      metadata,
      // Legacy snapshots came from the market feed originally, so we mark
      // them as system instruments. User-created custom instruments get
      // 'user' via InstrumentService.getOrCreate (PR3).
      createdBy: 'system',
      createdAt: now,
    };
  }
}
