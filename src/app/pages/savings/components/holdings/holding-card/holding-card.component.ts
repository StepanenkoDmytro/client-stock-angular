import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AssetClass } from '../../../../../domain/asset-class.domain';
import { IHoldingView } from '../../../../../domain/holding.domain';

/**
 * Single-holding card. Self-contained: takes an `IHoldingView` and renders
 * the symbol/badge, name, quantity/avgPrice/totalCost row, account, and tag
 * chips.
 *
 * Reused in:
 *  - HoldingsListComponent (full list under `/savings` Holdings view).
 *  - SavingsComponent Classes accordion (top-5 per class).
 *
 * Display helpers live here as instance methods so the component is
 * trivially droppable into any context.
 */
@Component({
  selector: 'pgz-holding-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './holding-card.component.html',
  styleUrl: './holding-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingCardComponent {
  @Input({ required: true }) public holding!: IHoldingView;

  public totalCost(): number {
    return this.holding.quantity * this.holding.averageBuyPrice;
  }

  public formatQuantity(): string {
    if (this.holding.instrument.assetClass === AssetClass.CRYPTO) {
      return this.holding.quantity.toLocaleString('en-US', {
        maximumFractionDigits: 8,
      });
    }
    return this.formatNumber(this.holding.quantity);
  }

  public formatNumber(value: number, fractionDigits = 2): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  public assetClassLabel(): string {
    switch (this.holding.instrument.assetClass) {
      case AssetClass.STOCK:
        return 'Stock';
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

  public assetClassBadgeColor(): string {
    switch (this.holding.instrument.assetClass) {
      case AssetClass.STOCK:
        return '#1976D2';
      case AssetClass.TOKENIZED_STOCK:
        return '#7B1FA2';
      case AssetClass.CRYPTO:
        return '#F57C00';
      case AssetClass.CASH:
        return '#388E3C';
      case AssetClass.DEPOSIT:
        return '#5D4037';
      case AssetClass.REAL_ESTATE:
        return '#00796B';
      case AssetClass.OTHER:
        return '#616161';
    }
  }
}
