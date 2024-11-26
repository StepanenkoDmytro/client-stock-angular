import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutes } from '../../../../app.routes';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AddTriggerService } from '../../../../service/helpers/add-trigger.service';
import { AddBtnComponent } from '../add-btn/add-btn.component';


export interface INavigationItem {
  path: AppRoutes;
  icon: string;
}

@Component({
  selector: 'pgz-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, AddBtnComponent],
})
export class NavigationComponent {
  public navigationItemsLeft: INavigationItem[] = [
    { path: AppRoutes.SPENDING, icon: 'account_balance_wallet' },
    { path: AppRoutes.SAVINGS, icon: 'savings' },
    // { path: AppRoutes.GOALS, icon: 'crisis_alert' },
    // { path: AppRoutes.PROFILE, icon: 'account_circle' },
  ];

  public navigationItemsRight: INavigationItem[] = [
    // { path: AppRoutes.SPENDING, icon: 'account_balance_wallet' },
    // { path: AppRoutes.SAVINGS, icon: 'savings' },
    { path: AppRoutes.GOALS, icon: 'crisis_alert' },
    // { path: AppRoutes.STATISTIC, icon: 'equalizer' },
    { path: AppRoutes.PROFILE, icon: 'account_circle' },
  ];

  constructor(private addTriggerService: AddTriggerService) { }

  public onButtonClick(): void {
    this.addTriggerService.triggerButtonClick();
  }
}
