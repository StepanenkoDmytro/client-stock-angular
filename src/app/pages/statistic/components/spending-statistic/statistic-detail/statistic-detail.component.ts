import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpendingsService } from '../../../../../service/spendings.service';
import { Category } from '../../../../../domain/category.domain';
import { MultiLineComponent } from '../../../../../core/UI/components/charts/multi-line/multi-line.component';
import { MatIconModule } from '@angular/material/icon';
import { BreadCrumb, StatisticStateService } from '../../../service/statistic-state.service';
import { SpendingStatisticCardComponent } from '../spending-statistic-card/spending-statistic-card.component';
import { ICategoryStatistic } from '../../../model/SpendindStatistic';
import { SpendingCategoryHelperService } from '../../../../../service/helpers/spending-category-helper.service';
import { PrevRouteComponent } from '../../prev-route/prev-route.component';

@Component({
  selector: 'pgz-statistic-detail',
  standalone: true,
  imports: [MultiLineComponent, SpendingStatisticCardComponent, MatIconModule, PrevRouteComponent],
  templateUrl: './statistic-detail.component.html',
  styleUrl: './statistic-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticDetailComponent implements OnInit {
  public categoryData: ICategoryStatistic[];
  public category: Category;

  constructor(
    private route: ActivatedRoute,
    private spendingService: SpendingsService,
    private router: Router,
    private statisticHelperService: StatisticStateService,
    private spendingsHelperService: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
    ) { }

    public ngOnInit(): void {
      this.route.paramMap.subscribe(async paramMap => {
        const categoryId = paramMap.get('id');
        await this.loadCategoryData(categoryId);
      });
    }
  
    private async loadCategoryData(categoryId: string): Promise<void> {
      this.category = await this.spendingService.findCategoryById(categoryId);
      
      this.spendingService.getAllSpendings().subscribe(async (spendings) => {
        const spendingsByCategory = this.spendingService.findSpendingsByCategoryIncludeChildren(spendings, this.category);
        this.categoryData = await this.spendingsHelperService.calculateCategoryStatisticByCategory(spendingsByCategory, this.category);
        this.cdr.detectChanges();
      });
    }

  // public prevRoute(): void {
  //   if(this.statisticHelperService.prevRoute) {
  //     this.router.navigate(['/statistic/details', this.statisticHelperService.prevRoute]);
  //   } else {
  //     this.router.navigate(['statistic']);
  //   }
  // }

  public onCardClick(newCategory: Category): void {
    
    this.statisticHelperService.addBreadCrumb(newCategory);
    this.router.navigate(['/statistic/details', newCategory.id]);
  }
}
