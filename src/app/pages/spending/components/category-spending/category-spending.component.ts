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
import { EditStateService } from '../../service/edit-state.service';
import { IconComponent } from '../../../../core/UI/components/icon/icon.component';
import { PrevRouteComponent } from '../../../../core/UI/components/prev-route/prev-route.component';

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
  public spendByCategory: number = 0;

  public spendingCategories: ICategoryStatistic[];

  constructor(
    private route: ActivatedRoute,
    private spendingsService: SpendingsService,
    private spendingCategoryHelper: SpendingCategoryHelperService,
    private router: Router,
    private categoryStateHelper: StatisticStateService,
    private editStateCategoryService: EditStateService,
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
      this.categories = categories.find(category => category.title === 'Spending').children;

      if (categoryId) {
        this.currCategory = await this.spendingsService.findCategoryById(categoryId);
        if(!this.currCategory.parent) {
          this.router.navigate(['/spending']);
        }
        this.spendings = this.spendingsService.findSpendingsByCategoryIncludeChildren(this.spendings, this.currCategory);
        this.spendingCategories = this.spendingCategoryHelper.calculateCategoryStatisticByCategory(this.spendings, this.currCategory);
        this.spendByCategory = this.spendings.reduce((accumulator, spending) => accumulator + spending.cost, 0);

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
    this.router.navigate(['/spending/add-category', this.currCategory.parent]);
  }

  public prevRoute(): void {
    if(this.currCategory && this.currCategory.parent) {
      this.router.navigate(['/spending/category', this.currCategory.parent]);
    } else {
      this.router.navigate(['/spending']);
    }
  }
}
