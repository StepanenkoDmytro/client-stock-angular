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
import {
  ILiability,
  isRevolvingLiability,
  liabilityTypeLabel,
} from '../../../../../domain/liability.domain';
import { CurrencySymbolPipe } from '../../../../../pipe/currency-symbol.pipe';
import { LiabilitiesService } from '../../../../../service/liabilities.service';
import { debtPayoffProgress } from '../../../model/net-worth.helper';

/**
 * One liability card on `/savings` (mockup savings/09 · plan L4). Slate
 * styling, no class dots, "paydown" instead of "gain" — a debt is the
 * inverse of a holding (ADR-0009).
 *
 *  - **Term debt** (mortgage / auto / …): "paid down X of Y" + payoff %,
 *    a "🎯 goal" badge (it has a freedom date → a debt-payoff goal).
 *  - **Revolving** (credit card / BNPL / margin): "used X of Y" =
 *    utilisation; no goal (no payoff date by definition).
 *
 * Amount shown in the liability's **native** currency (like holdings);
 * base-currency totals live on the band header / net-worth summary.
 */
@Component({
  selector: 'pgz-liability-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, CurrencySymbolPipe],
  templateUrl: './liability-card.component.html',
  styleUrl: './liability-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiabilityCardComponent {
  private readonly liabilitiesService = inject(LiabilitiesService);

  @Input({ required: true })
  public set liability(value: ILiability) {
    this._liability.set(value);
  }
  public get liability(): ILiability {
    return this._liability();
  }
  private readonly _liability = signal<ILiability>({} as ILiability);

  public readonly isRevolving = computed<boolean>(() =>
    isRevolvingLiability(this._liability().type),
  );

  public readonly name = computed<string>(() => {
    const l = this._liability();
    return l.lender || l.notes || liabilityTypeLabel(l.type);
  });

  public readonly currency = computed<string>(
    () => this._liability().currency ?? 'USD',
  );

  public readonly balance = computed<number>(
    () => this._liability().principalBalance ?? 0,
  );

  public readonly original = computed<number>(
    () => this._liability().originalAmount ?? 0,
  );

  /** Term: payoff fraction (paid / original). Revolving: utilisation
   *  (balance / limit). Both 0..1. */
  public readonly progress = computed<number>(() => {
    const l = this._liability();
    if (this.isRevolving()) {
      const limit = l.originalAmount ?? 0;
      return limit > 0 ? Math.min(1, (l.principalBalance ?? 0) / limit) : 0;
    }
    return debtPayoffProgress(l.originalAmount ?? 0, l.principalBalance ?? 0);
  });

  /** Sub-line: "{lender} · {rate}% {rateType} · until {year}" for term,
   *  "Revolving · {rate}% · no goal" for revolving. */
  public readonly subline = computed<string>(() => {
    const l = this._liability();
    const rate = `${l.interestRate ?? 0}%`;
    if (this.isRevolving()) {
      return `Revolving · ${rate} · no goal`;
    }
    const parts: string[] = [];
    const detail = l.lender || l.notes;
    if (detail && detail !== this.name()) parts.push(detail);
    parts.push(`${rate} ${(l.rateType ?? 'FIXED').toLowerCase()}`);
    const year = this.yearOf(l.endDate);
    if (year) parts.push(`until ${year}`);
    return parts.join(' · ');
  });

  /** Amount already paid down (term) — original − balance. */
  public readonly paidDown = computed<number>(() =>
    Math.max(0, this.original() - this.balance()),
  );

  // ---- Actions ----

  public onDelete(): void {
    this.liabilitiesService.deleteLiability(this._liability());
  }

  // ---- Display helpers ----

  public formatMoney(value: number): string {
    return Math.round(value).toLocaleString('en-US');
  }

  public formatPct(fraction: number): string {
    return `${Math.round(fraction * 100)}%`;
  }

  private yearOf(date: string | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
  }
}
