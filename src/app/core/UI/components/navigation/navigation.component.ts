import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AppRoutes } from '../../../../app.routes';
import { AddTriggerService } from '../../../../service/helpers/add-trigger.service';
import { AddBtnComponent } from '../add-btn/add-btn.component';

export interface INavigationItem {
  path: AppRoutes;
  icon: string;
  label: string;
}

/**
 * 5-slot mobile bottom navigation.
 *
 * Reference: design/savings/00-mobile-shell-baseline.svg lines 80-117.
 * Order: Savings · Spending · + (FAB) · Stats · Profile.
 *
 * Behaviour:
 *  - Each link uses `routerLinkActive` to switch to the accented state
 *    (light-blue pill behind icon + accent label color).
 *  - FAB centre slot delegates to AddTriggerService — pages subscribe
 *    to its `buttonClick$` and decide what "Add" means in their context
 *    (Savings → market dialog, Spending → add-spending form, etc.).
 *
 * No more UserMode.Dev gating — all 5 slots are visible to every user.
 */
@Component({
  selector: 'pgz-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, AddBtnComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  private readonly addTriggerService = inject(AddTriggerService);

  public readonly SAVINGS: INavigationItem = {
    path: AppRoutes.SAVINGS,
    icon: 'account_balance_wallet',
    label: 'Savings',
  };

  public readonly SPENDING: INavigationItem = {
    path: AppRoutes.SPENDING,
    icon: 'receipt_long',
    label: 'Spending',
  };

  public readonly STATS: INavigationItem = {
    path: AppRoutes.STATISTIC,
    icon: 'bar_chart',
    label: 'Stats',
  };

  public readonly PROFILE: INavigationItem = {
    path: AppRoutes.PROFILE,
    icon: 'person_outline',
    label: 'Profile',
  };

  public onAddClick(): void {
    this.addTriggerService.triggerButtonClick();
  }
}
