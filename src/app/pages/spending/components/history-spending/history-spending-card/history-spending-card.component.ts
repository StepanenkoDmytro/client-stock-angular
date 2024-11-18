import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { EditStateService } from '../../../service/edit-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Spending } from '../../../model/Spending';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'pgz-history-spending-card',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, IconComponent, CommonModule],
  templateUrl: './history-spending-card.component.html',
  styleUrl: './history-spending-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorySpendingCardComponent {
  @Input()
  public spending: Spending;

  constructor(
    private editStateSpendingService: EditStateService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  public onEdit(): void {
    const currentRoute = this.route.snapshot;
    const routeConfig = currentRoute.routeConfig;
    this.editStateSpendingService.saveEditStateSpending(this.spending, routeConfig);
    this.router.navigate(['/spending/add']);
  }

  public onDelete(): void {
    this.editStateSpendingService.deleteCurrentSpending(this.spending);
  }
}
