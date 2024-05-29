import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Category } from '../../../../domain/category.domain';
import { CategorySpendingCardComponent } from './category-spending-card/category-spending-card.component';
import { ICategoryStatistic } from '../../../statistic/model/SpendindStatistic';
import { Spending } from '../../model/Spending';
import { RouterModule } from '@angular/router';
import { SpendingCategoryHelperService } from '../../../../service/helpers/spending-category-helper.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DeleteCategoryDialogComponent } from './delete-category-dialog/delete-category-dialog.component';


@Component({
  selector: 'pgz-category-spending',
  standalone: true,
  imports: [CategorySpendingCardComponent, RouterModule],
  templateUrl: './category-spending.component.html',
  styleUrl: './category-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingComponent implements OnInit {
  @Input()
  public spendings: Spending[];
  @Input()
  public categories: Category[];

  public spendingCategories: ICategoryStatistic[];

  constructor(
    private spendingCategoryHelper: SpendingCategoryHelperService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  public async ngOnInit(): Promise<void> {
    this.spendingCategories = await this.spendingCategoryHelper.calculateCategoryStatistic(this.spendings);
    this.cdr.detectChanges();
  }

  public onDeleteCategory(category: Category): void {
    this.showDeleteCategoryDialod(category);
  }

  private showDeleteCategoryDialod(category: Category): void {
    const dialogRef: MatDialogRef<DeleteCategoryDialogComponent> = this.dialog.open(DeleteCategoryDialogComponent, {
      width: '400px',
      // data: this.emailCtrl.value,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result === 'save') {
        console.log('save');
      } else if (result === 'delete') {
        console.log('delete');
      }
    });
  }
}
