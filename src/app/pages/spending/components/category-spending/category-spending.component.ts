import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Category } from '../../../../domain/category.domain';
import { CategorySpendingCardComponent } from './category-spending-card/category-spending-card.component';
import { ICategoryStatistic } from '../../../statistic/model/SpendindStatistic';
import { Spending } from '../../model/Spending';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { deleteUnsavedData } from '../../../../store/sync-data.actions';
import { AddCategoryComponent } from './add-category/add-category.component';

@Component({
  selector: 'pgz-category-spending',
  standalone: true,
  imports: [CategorySpendingCardComponent],
  templateUrl: './category-spending.component.html',
  styleUrl: './category-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingComponent implements OnInit {
  @Input()
  public spendings: Spending[];
  public spendingCategories: ICategoryStatistic[];

  private categories: Category[] = Category.defaultList[1].children;

  constructor(
    private dialog: MatDialog,
  ) { }

  public ngOnInit(): void {
    this.spendingCategories = this.categories.map(category => ({
      category: category,
      value: 0
    }));
  }

  public addCategory(): void {
    const dialogRef: MatDialogRef<AddCategoryComponent> = this.dialog.open(AddCategoryComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      
    });
  }
}
