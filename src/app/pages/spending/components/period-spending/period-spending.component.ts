import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DonutComponent } from '../../../../core/UI/components/charts/donut/donut.component';
import { ID3Value } from '../../../../domain/d3.domain';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { NgClass } from "@angular/common";
import { ExpenseService } from '../../../../service/expense.service';
import { AddSpendingComponent } from '../add-spending/add-spending.component';
import { CATEGORY_SPENDING, ICategorySpending } from '../../../../domain/spending.domain';
import { switchMap } from 'rxjs';


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
  public categories: ICategorySpending[] = CATEGORY_SPENDING;
  @Input()
  public expends: ID3Value;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private expenseService: ExpenseService,
  ) { }

  public addSpending(category: ICategorySpending): void {
    this._bottomSheet.open(AddSpendingComponent, {
      data: { category }
    }).backdropClick().pipe(
      switchMap(() => this.expenseService.loadByMonth())
    ).subscribe();
  }
}
