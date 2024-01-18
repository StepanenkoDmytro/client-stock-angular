import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DonutComponent } from '../../../../core/UI/components/charts/donut/donut.component';
import { ID3Value } from '../../../../domain/d3.domain';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CommonModule, NgClass } from "@angular/common";
import { ExpenseService } from '../../../../service/expense.service';
import { AddSpendingComponent } from '../add-spending/add-spending.component';
import { switchMap } from 'rxjs';
import { Category } from '../../../../domain/category.domain';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';


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
    private _bottomSheet: MatBottomSheet,
    private expenseService: ExpenseService,
  ) { }

  public addBySelectSpending(category: Category): void {
    this._bottomSheet.open(AddSpendingComponent, {
      data: { category }
    }).backdropClick().pipe(
      switchMap(() => this.expenseService.loadByCurrentMonth())
    ).subscribe();
  }
}
