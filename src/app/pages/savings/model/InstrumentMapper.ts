import { v4 as uuid } from 'uuid';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { ICoin, ICompany } from '../../../domain/savings.domain';

/**
 * InstrumentMapper — bridge from the legacy market-data DTOs (`ICompany`,
 * `ICoin`) into the new `IInstrument` domain model (PR1).
 *
 * Used by `InstrumentService.addMarketInstruments(...)` after pulling
 * data from `StockService.getCompaniesList()` / `CoinService.getAllCoins()`.
 *
 * All mapped instruments are marked `createdBy: 'system'` — they originate
 * from market feeds. Custom user-created instruments (PR5) get
 * `createdBy: 'user'` via `InstrumentService.getOrCreate(...)`.
 */
export class InstrumentMapper {
  static fromICompany(company: ICompany): IInstrument {
    const currency = company.currency || 'USD';
    return {
      id: uuid(),
      assetClass: AssetClass.STOCK,
      symbol: company.symbol,
      name: company.name,
      currency,
      metadata: {
        kind: AssetClass.STOCK,
        exchange: company.exchange || '',
        currency,
        country: company.country || undefined,
        sector: company.sector || undefined,
        industry: company.industry || undefined,
        dividendYield: company.dividendYield ?? undefined,
      },
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    };
  }

  static fromICoin(coin: ICoin): IInstrument {
    // Crypto instruments are priced in USD by convention of our CoinCap
    // feed; per-user base currency normalization happens at the FX layer
    // (ADR-0002, planned for M3 — not yet implemented).
    const currency = 'USD';
    return {
      id: uuid(),
      assetClass: AssetClass.CRYPTO,
      symbol: coin.symbol,
      name: coin.name,
      currency,
      metadata: {
        kind: AssetClass.CRYPTO,
        coinId: coin.id,
      },
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    };
  }
}
