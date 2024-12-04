import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Category } from '../../../../domain/category.domain';
import { CategorySpendingCardComponent } from './category-spending-card/category-spending-card.component';
import { ICategoryStatistic } from '../../../statistic/model/SpendindStatistic';
import { Spending } from '../../model/Spending';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SpendingCategoryHelperService } from '../../../../service/helpers/spending-category-helper.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DeleteCategoryDialogComponent } from './delete-category-dialog/delete-category-dialog.component';
import { SpendingsService } from '../../../../service/spendings.service';
import { combineLatest, firstValueFrom } from 'rxjs';
import { AddBtnComponent } from '../../../../core/UI/components/add-btn/add-btn.component';
import { CommonModule } from '@angular/common';
import { StatisticStateService } from '../../../statistic/service/statistic-state.service';
import { PrevRouteComponent } from '../../../statistic/components/prev-route/prev-route.component';
import { EditStateService } from '../../service/edit-state.service';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';

const UI_COMPONENTS = [
  CategorySpendingCardComponent,
  AddBtnComponent,
  PrevRouteComponent,
  IconComponent,
];

const MATERIAL_MODULES = [
  CommonModule
];

@Component({
  selector: 'pgz-category-spending',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, RouterModule],
  templateUrl: './category-spending.component.html',
  styleUrl: './category-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingComponent implements OnInit {
  public currCategory: Category | null;
  public spendings: Spending[];
  public categories: Category[];

  public spendingCategories: ICategoryStatistic[];

  constructor(
    private route: ActivatedRoute,
    private spendingsService: SpendingsService,
    private spendingCategoryHelper: SpendingCategoryHelperService,
    private router: Router,
    private categoryStateHelper: StatisticStateService,
    private editStateCategoryService: EditStateService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  public async ngOnInit(): Promise<void> {
    this.spendingsService.init();
    combineLatest([
      this.route.paramMap,
      this.spendingsService.loadByCurrentMonth(),
      this.spendingsService.getAllCategories()
    ]).subscribe( async ([paramMap, spendings, categories]) => {

      const categoryId = paramMap.get('id');
      
      this.spendings = [...spendings];
      this.categories = categories[1].children;

      if (categoryId) {
        this.currCategory = await this.spendingsService.findCategoryById(categoryId);
        this.spendings = this.spendingsService.findSpendingsByCategoryIncludeChildren(this.spendings, this.currCategory);
        this.spendingCategories = this.spendingCategoryHelper.calculateCategoryStatisticByCategory(this.spendings, this.currCategory);
      } else {
        this.spendingCategories = await this.spendingCategoryHelper.calculateCategoryStatistic(this.spendings);
      }
      
      this.spendingCategories.sort((a,b) => b.value - a.value);
      this.cdr.detectChanges();
    });
  }

  public onCategoryClick(category: ICategoryStatistic): void {
    if(category.category.title === 'Other') {
      return;
    }

    this.categoryStateHelper.addBreadCrumb(category.category);
    this.router.navigate(['/spending/category', category.category.id]);
  }

  public addCategory(): void {
    if(this.currCategory) {
      this.router.navigate(['/spending/add-category', this.currCategory.id]);
    } else {
      const parentCategoryId = this.categories[0].parent;
      this.router.navigate(['/spending/add-category', parentCategoryId]);
    }
  }

  public onEdit(): void {
    this.categoryStateHelper.addBreadCrumb(this.currCategory);
    this.editStateCategoryService.saveEditStateCategory(this.currCategory);
    this.router.navigate(['/spending/add-category', this.currCategory.id]);
  }

  public onDeleteCategory(): void {
    this.showDeleteCategoryDialod(this.currCategory);
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
