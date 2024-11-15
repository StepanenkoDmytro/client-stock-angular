import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Category } from '../../../../domain/category.domain';
import { CategorySpendingCardComponent } from './category-spending-card/category-spending-card.component';
import { ICategoryStatistic } from '../../../statistic/model/SpendindStatistic';
import { Spending } from '../../model/Spending';
import { RouterModule } from '@angular/router';
import { SpendingCategoryHelperService } from '../../../../service/helpers/spending-category-helper.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DeleteCategoryDialogComponent } from './delete-category-dialog/delete-category-dialog.component';
import { SpendingsService } from '../../../../service/spendings.service';
import { combineLatest, firstValueFrom } from 'rxjs';


@Component({
  selector: 'pgz-category-spending',
  standalone: true,
  imports: [CategorySpendingCardComponent, RouterModule],
  templateUrl: './category-spending.component.html',
  styleUrl: './category-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingComponent implements OnInit {
  public spendings: Spending[];
  public categories: Category[];

  public spendingCategories: ICategoryStatistic[];

  constructor(
    private spendingsService: SpendingsService,
    private spendingCategoryHelper: SpendingCategoryHelperService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  public async ngOnInit(): Promise<void> {
    combineLatest([
      this.spendingsService.loadByCurrentMonth(),
      this.spendingsService.getAllCategories()
    ]).subscribe( async ([spendings, categories]) => {
      
      this.spendings = [...spendings];
      this.categories = categories[1].children;

      this.spendingCategories = await this.spendingCategoryHelper.calculateCategoryStatistic(spendings);
      this.spendingCategories.sort((a,b) => b.value - a.value);
       this.cdr.detectChanges();
    });
  }

  public onDeleteCategory(category: Category): void {
    this.showDeleteCategoryDialod(category);
  }

  private showDeleteCategoryDialod(category: Category): void {
    const dialogRef: MatDialogRef<DeleteCategoryDialogComponent> = this.dialog.open(DeleteCategoryDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async result => {
      const allSpendings: Spending[] = await firstValueFrom(this.spendingsService.getAllSpendings());
      const spendingsToUpdate: Spending[] = this.spendingsService.findSpendingsByCategoryIncludeChildren(allSpendings, category);
      
      if(result === 'save') {
        const otherCategory = this.categories.find(category => category.title === 'Other');
        this.spendingsService.replaceCategoryInSpendings(otherCategory, spendingsToUpdate);
      } else if (result === 'delete') {
        spendingsToUpdate.forEach(spending => this.spendingsService.deleteSpending(spending));
      }
      this.spendingsService.deleteCategory(category);
    });
  }
}
