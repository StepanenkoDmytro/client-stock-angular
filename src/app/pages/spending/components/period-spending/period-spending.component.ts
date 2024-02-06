import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DonutComponent } from '../../../../core/UI/components/charts/donut/donut.component';
import { ID3Value } from '../../../../domain/d3.domain';
import { CommonModule, NgClass } from "@angular/common";
import { Category } from '../../../../domain/category.domain';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';
import { EditStateSpendingService } from '../../service/edit-state-spending.service';
import { Router } from '@angular/router';
import { Spending } from '../../model/Spending';


const UI_COMPONENTS = [
  DonutComponent,
  IconComponent,
  NgClass
];

@Component({
  selector: 'pgz-period-spending',
  standalone: true,
  imports: [...UI_COMPONENTS, CommonModule],
  templateUrl: './period-spending.component.html',
  styleUrl: './period-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodSpendingComponent {

  @Input()
  public expends: ID3Value;

  public categories: Category[] = Category.defaultList[1].children;

  constructor(
    private editStateService: EditStateSpendingService,
    private router: Router 
  ) { }

  public addBySelectSpending(category: Category): void {
    const newSpending: Spending = new Spending(
      false,
      category,
      '',
      0,
      new Date(),
    );
    newSpending.category = category;
    this.editStateService.saveEditStateSpending(newSpending);
    this.router.navigate(['/spending/add']);
  }
}
