import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { AssetClass } from '../../../../../domain/asset-class.domain';
import { IHoldingView } from '../../../../../domain/holding.domain';
import { ITag } from '../../../../../domain/tag.domain';
import { HoldingService } from '../../../service/holding.service';
import { InstrumentService } from '../../../service/instrument.service';
import { LivePriceService } from '../../../service/live-price.service';
import { TagsService } from '../../../service/tags.service';
import { selectHoldingsList } from '../../../store/holdings.selectors';
import { selectTagsList } from '../../../store/tags.selectors';

interface ClassBreakdown {
  assetClass: AssetClass;
  label: string;
  color: string;
  value: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
  share: number;
}

/**
 * PortfolioSummaryComponent — top-level summary card showing total
 * portfolio value, P&L, and per-class distribution.
 *
 * Lives outside any individual view (Classes / Holdings) — it's always
 * visible at the top of `/savings`. Internally it computes from the same
 * source signals as HoldingsListComponent/SavingsComponent (store +
 * InstrumentService + HoldingService.getCurrentPrice), so swapping views
 * doesn't cause the summary to be torn down and rebuilt.
 *
 * Self-contained: no inputs. Reads holdings + tags + instruments + mock
 * current prices on its own. When PriceFeedService (ADR-0003) lands in
 * M3, swap `holdings.getCurrentPrice` for `priceFeed.priceFor(symbol)`.
 */
@Component({
  selector: 'pgz-portfolio-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-summary.component.html',
  styleUrl: './portfolio-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioSummaryComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly livePrice = inject(LivePriceService);
  private readonly tags = inject(TagsService);

  private readonly rawHoldings = this.store.selectSignal(selectHoldingsList);
  private readonly rawTags = this.store.selectSignal(selectTagsList);

  private readonly holdingsView = computed<IHoldingView[]>(() => {
    const instrMap = this.instruments.instruments();
    const holdings = this.rawHoldings();
    const tags = this.rawTags();
    const tagsById = new Map(tags.map((t: ITag) => [t.id, t]));
    const result: IHoldingView[] = [];
    for (const h of holdings) {
      const instrument = instrMap.get(h.instrumentId);
      if (!instrument) {
        continue;
      }
      const resolvedTags = h.tagIds
        .map((id) => tagsById.get(id))
        .filter((t): t is ITag => !!t);
      result.push({ ...h, instrument, tags: resolvedTags });
    }
    return result;
  });

  public readonly summary = computed(() => {
    const all = this.holdingsView();
    /**
     * Live-prices doc §3 Rule 2:
     *  - `totalValue` mixes live prices and `averageBuyPrice` fallback so
     *     the dashboard shows a whole number (some part is "estimate from
     *     cost basis", silently).
     *  - `totalPnL` and `totalPnLPercent` only count the portion of the
     *     portfolio that has a real live price — otherwise unpriced
     *     holdings would force P&L to read as 0 / -100% and mislead.
     *  - `pricedValue` and `pricedCostBasis` are the inputs for the P&L
     *     computation; their delta is the P&L for the priced subset.
     */
    interface Bucket {
      value: number;          // mixed: live or cost-basis fallback
      costBasis: number;      // sum(quantity × avgBuyPrice) — every holding
      pricedValue: number;    // sum(quantity × livePrice) — priced subset
      pricedCostBasis: number; // sum(quantity × avgBuyPrice) — priced subset
    }
    const byClass = new Map<AssetClass, Bucket>();

    for (const h of all) {
      const live = this.livePrice.getCurrentPrice(h.instrument.id);
      const effectivePrice = live ?? h.averageBuyPrice;
      const value = h.quantity * effectivePrice;
      const cost = h.quantity * h.averageBuyPrice;
      const priced = live !== undefined;
      const existing = byClass.get(h.instrument.assetClass) ?? {
        value: 0,
        costBasis: 0,
        pricedValue: 0,
        pricedCostBasis: 0,
      };
      byClass.set(h.instrument.assetClass, {
        value: existing.value + value,
        costBasis: existing.costBasis + cost,
        pricedValue: existing.pricedValue + (priced ? value : 0),
        pricedCostBasis: existing.pricedCostBasis + (priced ? cost : 0),
      });
    }

    const totalValue = Array.from(byClass.values()).reduce(
      (s, c) => s + c.value,
      0,
    );
    const totalCost = Array.from(byClass.values()).reduce(
      (s, c) => s + c.costBasis,
      0,
    );
    const pricedValue = Array.from(byClass.values()).reduce(
      (s, c) => s + c.pricedValue,
      0,
    );
    const pricedCostBasis = Array.from(byClass.values()).reduce(
      (s, c) => s + c.pricedCostBasis,
      0,
    );
    const totalPnL = pricedValue - pricedCostBasis;
    const totalPnLPercent =
      pricedCostBasis > 0 ? (totalPnL / pricedCostBasis) * 100 : 0;

    const breakdown: ClassBreakdown[] = Array.from(byClass.entries())
      .map(([assetClass, b]) => ({
        assetClass,
        label: this.assetClassLabel(assetClass),
        color: this.assetClassBadgeColor(assetClass),
        value: b.value,
        costBasis: b.costBasis,
        pnl: b.pricedValue - b.pricedCostBasis,
        pnlPercent:
          b.pricedCostBasis > 0
            ? ((b.pricedValue - b.pricedCostBasis) / b.pricedCostBasis) * 100
            : 0,
        share: totalValue > 0 ? b.value / totalValue : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
      breakdown,
    };
  });

  ngOnInit(): void {
    this.tags.init();
    this.instruments.init();
    this.holdings.init();
  }

  // ---- helpers ----

  public abs(n: number): number {
    return Math.abs(n);
  }

  public formatNumber(value: number, fractionDigits = 0): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  public formatPercent(value: number, fractionDigits = 1): string {
    return (
      value.toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }) + '%'
    );
  }

  public assetClassLabel(ac: AssetClass): string {
    switch (ac) {
      case AssetClass.STOCK:
        return 'Stock';
      case AssetClass.ETF:
        return 'ETF';
      case AssetClass.TOKENIZED_STOCK:
        return 'Tokenized stock';
      case AssetClass.CRYPTO:
        return 'Crypto';
      case AssetClass.CASH:
        return 'Cash';
      case AssetClass.DEPOSIT:
        return 'Deposit';
      case AssetClass.REAL_ESTATE:
        return 'Real estate';
      case AssetClass.OTHER:
        return 'Other';
    }
  }

  /** Theme-aware AssetClass colour (CSS var resolved in inline styles). */
  public assetClassBadgeColor(ac: AssetClass): string {
    switch (ac) {
      case AssetClass.STOCK:
        return 'var(--asset-stock)';
      case AssetClass.ETF:
        return 'var(--asset-etf, var(--asset-stock))';
      case AssetClass.TOKENIZED_STOCK:
        return 'var(--asset-tokenized-stock)';
      case AssetClass.CRYPTO:
        return 'var(--asset-crypto)';
      case AssetClass.CASH:
        return 'var(--asset-cash)';
      case AssetClass.DEPOSIT:
        return 'var(--asset-deposit)';
      case AssetClass.REAL_ESTATE:
        return 'var(--asset-real-estate)';
      case AssetClass.OTHER:
        return 'var(--asset-other)';
    }
  }
}
