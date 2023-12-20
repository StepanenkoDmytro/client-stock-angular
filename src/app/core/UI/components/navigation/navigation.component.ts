import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutes } from '../../../../app.routes';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';


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
  imports: [CommonModule, RouterModule, MatIconModule],
})
export class NavigationComponent {
  public navigationItems: INavigationItem[] = [
    { path: AppRoutes.SPENDING, icon: 'account_balance_wallet' },
    { path: AppRoutes.SAVINGS, icon: 'savings' },
    { path: AppRoutes.PROFILE, icon: 'account_circle' },
  ]
}
