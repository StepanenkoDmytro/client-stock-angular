import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  CRYPTO_EXCHANGE_CODE,
  MarketStatus,
} from '../../../../domain/market-status.domain';
import { MarketStatusService } from '../../service/market-status.service';

/**
 * Subtle indicator that lives beside the price in a `pgz-position-card`
 * for STOCK / ETF holdings. Renders either:
 *
 *   <green-dot> Market open
 *   <gray-dot>  Closed · opens in 2h 15min
 *   <gray-dot>  Closed · opens Mon 09:30
 *
 * Re-renders the countdown text every minute via
 * {@link MarketStatusService}'s {@code tick} signal — no explicit timer
 * lives in this component.
 *
 * Renders nothing when the exchange is unknown (no badge for CASH /
 * DEPOSIT / REAL_ESTATE / OTHER, or for instruments whose metadata is
 * missing an {@code exchange} field).
 */
@Component({
  selector: 'pgz-market-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './market-status-badge.component.html',
  styleUrl: './market-status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketStatusBadgeComponent {
  private readonly marketStatus = inject(MarketStatusService);

  @Input({ required: true })
  public set exchangeCode(code: string | undefined | null) {
    this._exchangeCode.set(code ?? null);
  }
  public get exchangeCode(): string | null {
    return this._exchangeCode();
  }
  private readonly _exchangeCode = signal<string | null>(null);

  /**
   * Reads the cached status for the exchange this badge represents.
   * Returns {@code undefined} for unknown codes (treated as "don't render"
   * in the template).
   */
  public readonly status = computed<MarketStatus | undefined>(() => {
    const code = this._exchangeCode();
    if (!code) {
      return undefined;
    }
    return this.marketStatus.getStatus(code);
  });

  /**
   * "Market open" / "Closed · opens in 2h 15min" / "Closed · opens Mon 09:30".
   * Recomputes on every status refresh AND on every {@code tick} (every
   * minute) so the countdown stays current without a per-component timer.
   */
  public readonly label = computed<string>(() => {
    const s = this.status();
    if (!s) {
      return '';
    }
    if (s.isOpen) {
      return s.code === CRYPTO_EXCHANGE_CODE ? '24/7' : 'Market open';
    }
    // Read the tick so this computed re-evaluates on minute boundaries.
    const now = this.marketStatus.tick();
    return `Closed · opens ${this.formatNextOpen(s.nextChangeAt, now)}`;
  });

  /** Short prefix used as a CSS hook for the colored dot. */
  public readonly tone = computed<'open' | 'closed' | 'hidden'>(() => {
    const s = this.status();
    if (!s) {
      return 'hidden';
    }
    return s.isOpen ? 'open' : 'closed';
  });

  /**
   * Renders a wall-clock duration / day reference to the next open.
   *   < 60s         → "in <1min"
   *   < 60min       → "in 5min"
   *   < 24h         → "in 2h 15min"
   *   ≥ 24h         → "Mon 09:30"
   */
  private formatNextOpen(
    nextChangeAt: number | string | null,
    nowMs: number,
  ): string {
    if (nextChangeAt === null || nextChangeAt === undefined) {
      return 'soon';
    }
    const targetMs = MarketStatusBadgeComponent.toMs(nextChangeAt);
    if (!Number.isFinite(targetMs)) {
      return 'soon';
    }
    const diffMs = targetMs - nowMs;
    if (diffMs <= 0) {
      return 'soon';
    }
    const diffMinTotal = Math.floor(diffMs / 60_000);
    if (diffMinTotal < 1) {
      return 'in <1min';
    }
    if (diffMinTotal < 60) {
      return `in ${diffMinTotal}min`;
    }
    const hours = Math.floor(diffMinTotal / 60);
    const minutes = diffMinTotal % 60;
    if (hours < 24) {
      return minutes > 0 ? `in ${hours}h ${minutes}min` : `in ${hours}h`;
    }
    // ≥ 24h — drop minute precision in favour of weekday + clock time.
    const d = new Date(targetMs);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${weekday} ${time}`;
  }

  /**
   * Backend currently serialises {@code Instant} as epoch-seconds-with-nanos
   * float (Spring Boot 2.6 Jackson default; known QoL issue from PR8a §5).
   * Accept both number-of-seconds and ISO-8601 string for forward compat.
   */
  private static toMs(value: number | string): number {
    if (typeof value === 'number') {
      return value * 1000;
    }
    const parsed = Date.parse(value);
    return parsed;
  }
}
