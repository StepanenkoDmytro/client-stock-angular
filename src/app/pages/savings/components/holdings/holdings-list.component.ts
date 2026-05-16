import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AssetClass } from '../../../../domain/asset-class.domain';
import { IHoldingView } from '../../../../domain/holding.domain';
import { PrevRouteComponent } from '../../../../core/UI/components/prev-route/prev-route.component';
import { HoldingService } from '../../service/holding.service';
import { InstrumentService } from '../../service/instrument.service';
import { TagsService } from '../../service/tags.service';
import { selectHoldingsView } from '../../store/holdings.selectors';

@Component({
  selector: 'pgz-holdings-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PrevRouteComponent],
  templateUrl: './holdings-list.component.html',
  styleUrl: './holdings-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HoldingsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly holdings = inject(HoldingService);
  private readonly instruments = inject(InstrumentService);
  private readonly tags = inject(TagsService);

  // Re-derive selectHoldingsView whenever the instruments map changes.
  public readonly holdingsView = computed<IHoldingView[]>(() => {
    const instrMap = this.instruments.instruments();
    return this.store.selectSignal(selectHoldingsView(instrMap))();
  });

  ngOnInit(): void {
    // Order matters — instrument cache + tags must be ready when holdings
    // try to join with them.
    this.tags.init();
    this.instruments.init();
    this.holdings.init();
  }

  public goBack(): void {
    this.router.navigate(['/savings']);
  }

  public resetDemo(): void {
    this.holdings.resetDemoData();
  }

  public totalCost(h: IHoldingView): number {
    return h.quantity * h.averageBuyPrice;
  }

  public assetClassLabel(ac: AssetClass): string {
    switch (ac) {
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

  public assetClassBadgeColor(ac: AssetClass): string {
    switch (ac) {
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

  public formatNumber(value: number, fractionDigits = 2): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  /**
   * For crypto we show up to 8 significant digits (per ux-principles §7),
   * for fiat — 2 decimals.
   */
  public formatQuantity(h: IHoldingView): string {
    if (h.instrument.assetClass === AssetClass.CRYPTO) {
      return h.quantity.toLocaleString('en-US', {
        maximumFractionDigits: 8,
      });
    }
    return this.formatNumber(h.quantity, 2);
  }
}
