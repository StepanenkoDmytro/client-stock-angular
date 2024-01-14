import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ISpending } from '../../../../../domain/spending.domain';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { EditStateSpendingService } from '../../../service/edit-state-spending.service';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'pgz-history-spending-card',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, IconComponent],
  templateUrl: './history-spending-card.component.html',
  styleUrl: './history-spending-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorySpendingCardComponent {
  @Input()
  public spending: ISpending;

  constructor(
    private editStateService: EditStateSpendingService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  public edit(): void {
    const currentRoute = this.route.snapshot;
    const routeConfig = currentRoute.routeConfig;
    this.editStateService.saveEditStateSpending(this.spending, routeConfig);
    this.router.navigate(['/spending/add']);
  }
}
