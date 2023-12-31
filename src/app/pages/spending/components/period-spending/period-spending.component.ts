import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DonutComponent } from '../../../../core/UI/components/charts/donut/donut.component';
import { ID3Value } from '../../../../domain/d3.domain';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { NgClass } from "@angular/common";
import { ExpenseService } from '../../../../service/expense.service';
import { AddSpendingComponent } from '../add-spending/add-spending.component';
import { switchMap } from 'rxjs';
import { Category } from '../../../../domain/category.domain';


const UI_COMPONENTS = [
  DonutComponent,
  NgClass
];

@Component({
  selector: 'pgz-period-spending',
  standalone: true,
  imports: [...UI_COMPONENTS],
  templateUrl: './period-spending.component.html',
  styleUrl: './period-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodSpendingComponent {

  @Input()
  public expends: ID3Value;

  public categories: Category[] = Category.defaultList;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private expenseService: ExpenseService,
  ) { }

  public addSpending(category: Category): void {
    this._bottomSheet.open(AddSpendingComponent, {
      data: { category }
    }).backdropClick().pipe(
      switchMap(() => this.expenseService.loadByMonth())
    ).subscribe();
  }
}
