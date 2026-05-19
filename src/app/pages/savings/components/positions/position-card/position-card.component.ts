import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AssetClass } from '../../../../../domain/asset-class.domain';
import { IPosition } from '../../../../../domain/position.domain';
import { PriceDirection } from '../../../../../domain/price-quote.domain';
import { ITag } from '../../../../../domain/tag.domain';
import {
  rightColumnSecondLineFor,
  sublineFor,
} from '../../../model/card-display.helper';
import { HoldingActionsService } from '../../../service/holding-actions.service';
import { HoldingService } from '../../../service/holding.service';
import { LivePriceService } from '../../../service/live-price.service';
import { MarketStatusService } from '../../../service/market-status.service';
import { MarketStatusBadgeComponent } from '../../market-status-badge/market-status-badge.component';
import { PositionRowComponent } from '../position-row/position-row.component';
import { AccountLinkChipComponent } from '../../accounts/account-link-chip/account-link-chip.component';
import { IncomeLine, incomeLineFor } from './income-line.helper';

/**
 * Aggregate card for one Instrument's holdings — a "Position" in
 * ADR-0001 terms.
 *
 * Reference: design/savings/02-position-card-btc.svg.
 *
 * Two states:
 *   - **Collapsed** (default). Row 1: symbol + tag-dots + totalValue.
 *     Row 2: subline — single-holding cards show the per-class subline
 *     (same shape as `pgz-holding-card`); multi-holding cards show
 *     "{name} · {totalQty} {unit} across {N} locations".
 *   - **Expanded** (only when `holdings.length > 1`). Adds a dashed
 *     divider + one `pgz-position-row` per holding, sorted by holding
 *     value desc.
 *
 * Single-holding positions never show a chevron and don't react to
 * clicks — there is nothing to expand. Multi-holding positions toggle
 * expanded state on header click and on chevron click.
 *
 * Surface variants mirror `pgz-holding-card`: `card` (white, full
 * border) used when the card stands alone; `subcard` (sub-bg, no
 * shadow) used inside a class accordion panel.
 */
@Component({
  selector: 'pgz-position-card',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MarketStatusBadgeComponent,
    PositionRowComponent,
    AccountLinkChipComponent,
  ],
  templateUrl: './position-card.component.html',
  styleUrl: './position-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionCardComponent {
  private static readonly MAX_TAG_DOTS = 4;

  private readonly actions = inject(HoldingActionsService);
  private readonly holdings = inject(HoldingService);
  private readonly livePrice = inject(LivePriceService);

  // ---- Inputs ----

  @Input({ required: true })
  public set position(value: IPosition) {
    this._position.set(value);
  }
  public get position(): IPosition {
    return this._position();
  }
  private readonly _position = signal<IPosition>({} as IPosition);

  @Input() public variant: 'card' | 'subcard' = 'card';

  /**
   * Whether the user can expand a multi-holding Position into per-Account
   * rows. Default `true` — needed in Holdings flat view where the card
   * stands alone. We turn it OFF in Classes view because the class
   * accordion already supplies a layer of expand/collapse navigation;
   * adding a second one inside each position would be one click too many
   * for the same information density. In Classes view the user sees the
   * collapsed Position with its subline ("0.32 BTC across 3 locations")
   * and drills into per-Account detail by switching to Holdings view.
   */
  @Input()
  public set expandable(v: boolean) {
    this._expandable.set(v);
  }
  public get expandable(): boolean {
    return this._expandable();
  }
  private readonly _expandable = signal(true);

  /**
   * Render the row-1 tag dots? Off in the Classes accordion subcard variant
   * (`savings.component.html` passes `false`) — tag filter context isn't
   * relevant inside an already-grouped class panel.
   */
  @Input()
  public set showTags(v: boolean) {
    this._showTags.set(v);
  }
  public get showTags(): boolean {
    return this._showTags();
  }
  private readonly _showTags = signal(true);

  /**
   * Render the ⋯ overflow menu (Edit / Delete)? Off in the subcard variant —
   * edit/delete are reachable via the Holdings flat view's per-card menu
   * instead, so the accordion stays visually quieter.
   */
  @Input()
  public set showActions(v: boolean) {
    this._showActions.set(v);
  }
  public get showActions(): boolean {
    return this._showActions();
  }
  private readonly _showActions = signal(true);

  /**
   * Render the `pgz-market-status-badge`? Off in the subcard variant per
   * PR5c §10 #8 — the accordion already groups by class, and a row of
   * "Market open" badges inside one expanded panel adds noise.
   */
  @Input()
  public set showMarketStatus(v: boolean) {
    this._showMarketStatus.set(v);
  }
  public get showMarketStatus(): boolean {
    return this._showMarketStatus();
  }
  private readonly _showMarketStatus = signal(true);

  /**
   * Render the class-indicator dot (left of the symbol)? Default `true`
   * for Holdings flat view where the user needs a per-card class anchor.
   * Off in the Classes accordion subcard (`savings.component.html`
   * passes `false`) — the parent class panel already provides the
   * class identity, repeating the dot inside each subcard is noise.
   * Per PR5d §4.2 acceptance criteria.
   */
  @Input()
  public set showClassDot(v: boolean) {
    this._showClassDot.set(v);
  }
  public get showClassDot(): boolean {
    return this._showClassDot();
  }
  private readonly _showClassDot = signal(true);

  // ---- Local state ----

  private readonly _expanded = signal(false);
  public readonly expanded = this._expanded.asReadonly();

  // ---- Derived ----

  public readonly isMulti = computed<boolean>(() => {
    return (this._position().holdings ?? []).length > 1;
  });

  /** Whether the user can actually trigger an expand. Drives the chevron
   *  visibility and `toggle()` behaviour. */
  public readonly canExpand = computed<boolean>(() => {
    return this.isMulti() && this._expandable();
  });

  public readonly tagDots = computed<ITag[]>(() => {
    const tags = this._position().tags ?? [];
    return tags.slice(0, PositionCardComponent.MAX_TAG_DOTS);
  });

  /** Row-2 left subline. Delegates to {@link sublineFor} helper (PR5c §4). */
  public readonly subline = computed<string>(() => sublineFor(this._position()));

  /**
   * `accountId` for the single-holding case — drives the
   * `<pgz-account-link-chip>` rendered under the subline. Returns null
   * for multi-holding positions (those expose per-account chips inside
   * the breakdown rows instead) and for holdings without an account
   * (legacy seed cash sometimes has `accountId === undefined`).
   */
  public readonly singleAccountId = computed<string | null>(() => {
    const holdings = this._position().holdings ?? [];
    if (holdings.length !== 1) return null;
    return holdings[0].accountId ?? null;
  });

  /**
   * Right-column second line under the value cell — "{qty} sh × $price"
   * for market-backed classes, "≈ ${amount}" for cash, maturity date for
   * deposits, empty for real-estate / other.
   *
   * Price source: {@link HoldingService.getCurrentPrice}, which since
   * PR-A4 delegates to {@link LivePriceService} (30s polling) with mock
   * fallback. Recomputes on every live tick.
   */
  public readonly secondLine = computed<string>(() =>
    rightColumnSecondLineFor(this._position(), (symbol) =>
      this.holdings.getCurrentPrice(symbol),
    ),
  );

  /**
   * Row-3 right slot ("3.0% yield" / "5% APR · 30-day lock" / etc.).
   * See {@link incomeLineFor} for the per-class policy.
   */
  public readonly incomeLine = computed<IncomeLine>(() =>
    incomeLineFor(this._position()),
  );

  /**
   * Card height policy (PR5c §4): real-estate is compact 72h (no row 3),
   * everything else is the standard 88h with row 3 visible.
   */
  public readonly cardHeight = computed<88 | 72>(() => {
    const ac = this._position().instrument?.assetClass;
    return ac === AssetClass.REAL_ESTATE ? 72 : 88;
  });

  /** Skip the PnL + period + income row for compact-height classes. */
  public readonly hideRowThree = computed<boolean>(() => {
    const ac = this._position().instrument?.assetClass;
    return ac === AssetClass.REAL_ESTATE;
  });

  /** AssetClass colour for the leading class-dot. */
  public readonly classDotColor = computed<string>(() => {
    const ac = this._position().instrument?.assetClass ?? AssetClass.OTHER;
    return this.assetClassBadgeColor(ac);
  });

  /**
   * Position's lifetime period — formatted as "today" / "3d" / "5m" /
   * "2y 4m" based on the *oldest* holding inside the Position. We pick
   * oldest (not newest) because the user's intuition of "how long I've
   * held this" is anchored to when they first opened the position, not
   * when they last topped it up.
   */
  public readonly periodLabel = computed<string>(() => {
    const holdings = this._position().holdings ?? [];
    if (holdings.length === 0) {
      return '';
    }
    const oldestMs = holdings.reduce((min, h) => {
      const t = Date.parse(h.openedAt ?? h.createdAt);
      return Number.isFinite(t) && t < min ? t : min;
    }, Date.now());
    const days = Math.floor(
      (Date.now() - oldestMs) / (1000 * 60 * 60 * 24),
    );
    if (days < 1) {
      return 'today';
    }
    if (days < 30) {
      return `${days}d`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months}m`;
    }
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
  });

  /** Sign character used in the lifetime row (matches HoldingCard). */
  public pnlSign(): string {
    return this._position().paperPnL >= 0 ? '+' : '−';
  }

  /**
   * Auto-clearing flash hint from the live price service. Drives the
   * subtle green/red pulse on the value cell when a new poll brings a
   * different price for this position's instrument. {@code null} when
   * no recent change or no live data yet.
   */
  public readonly flashDirection = computed<PriceDirection | null>(() => {
    const inst = this._position().instrument;
    if (!inst) {
      return null;
    }
    return this.livePrice.getFlashDirection(inst.id);
  });

  /**
   * Exchange code feeding the `pgz-market-status-badge`. Returns
   * {@code undefined} for asset classes that don't track market hours
   * (CASH / DEPOSIT / REAL_ESTATE / OTHER) — the badge then renders
   * nothing.
   */
  public readonly exchangeCode = computed<string | undefined>(() => {
    const inst = this._position().instrument;
    if (!inst) {
      return undefined;
    }
    return MarketStatusService.exchangeOf(inst);
  });

  // ---- Actions ----

  public toggle(): void {
    if (this.canExpand()) {
      this._expanded.update((v) => !v);
    }
  }

  /**
   * Single-holding Positions surface the overflow menu directly on the
   * card (no per-row drill-down needed). Multi-holding Positions get
   * the menu on each `pgz-position-row` instead — we deliberately don't
   * show "Edit Position" because Position is a computed aggregate, not
   * a stored entity (ADR-0001).
   */
  public readonly hasSingleHoldingActions = computed<boolean>(() => {
    return (this._position().holdings ?? []).length === 1;
  });

  public onEditSingle(): void {
    const holdings = this._position().holdings ?? [];
    if (holdings.length !== 1) {
      return;
    }
    this.actions.editHolding(holdings[0].id);
  }

  public onDeleteSingle(): void {
    const pos = this._position();
    const holdings = pos.holdings ?? [];
    if (holdings.length !== 1) {
      return;
    }
    this.actions.deleteHolding(holdings[0], pos.holdingValues[0] ?? 0);
  }

  // ---- Display helpers (template) ----

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

  public abs(n: number): number {
    return Math.abs(n);
  }

  /** Human-readable class label — drives the class-dot `aria-label`. */
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

  /**
   * Theme-aware AssetClass colour (resolves to a CSS custom property).
   * Mirrors the same mapping used by `savings.component` and
   * `holdings-list.component` so dots stay consistent across screens.
   */
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

// All subline / second-line / income-line logic moved to pure helpers in
// `pages/savings/model/card-display.helper.ts` and
// `./income-line.helper.ts` (PR5c).
