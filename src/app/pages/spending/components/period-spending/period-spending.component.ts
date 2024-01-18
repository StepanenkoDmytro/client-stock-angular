import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { DonutComponent } from '../../../../core/UI/components/charts/donut/donut.component';
import { ID3Value } from '../../../../domain/d3.domain';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { NgClass } from "@angular/common";
import { ExpenseService } from '../../../../service/expense.service';
import { AddSpendingComponent } from '../add-spending/add-spending.component';
import { switchMap } from 'rxjs';
import { Category } from '../../../../domain/category.domain';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';

interface IViewCategory {
  category: Category,
  angle: number;
}

const FULL_CIRCLE_ANGLE: number = 360;


const UI_COMPONENTS = [
  DonutComponent,
  IconComponent,
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
export class PeriodSpendingComponent implements OnInit {

  @Input()
  public expends: ID3Value;

  public viewCategories: IViewCategory[] = [];
  private categories: Category[] = Category.defaultList[1].children;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private expenseService: ExpenseService,
  ) { }

  public ngOnInit(): void {
    const angleStep: number = FULL_CIRCLE_ANGLE/this.categories.length;
    this.viewCategories = this.categories.map((category: Category, index: number) => ({
      category,
      angle: angleStep * index,
    }));
  }

  public addSpending(category: Category): void {
    this._bottomSheet.open(AddSpendingComponent, {
      data: { category }
    }).backdropClick().pipe(
      switchMap(() => this.expenseService.loadByCurrentMonth())
    ).subscribe();
  }
}
