import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpendingsService } from '../../../../../service/spendings.service';
import { Category } from '../../../../../domain/category.domain';
import { MultiLineComponent } from '../../../../../core/UI/components/charts/multi-line/multi-line.component';
import { MatIconModule } from '@angular/material/icon';
import { StatisticStateService } from '../../../service/statistic-state.service';
import { SpendingStatisticCardComponent } from '../spending-statistic-card/spending-statistic-card.component';
import { ICategoryStatistic } from '../../../model/SpendindStatistic';
import { SpendingCategoryHelperService } from '../../../../../service/helpers/spending-category-helper.service';

@Component({
  selector: 'pgz-statistic-detail',
  standalone: true,
  imports: [MultiLineComponent, SpendingStatisticCardComponent, MatIconModule, ],
  templateUrl: './statistic-detail.component.html',
  styleUrl: './statistic-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticDetailComponent implements OnInit {
  public categoryData: ICategoryStatistic[];
  categoryId: string;

  constructor(
    private route: ActivatedRoute,
    private spendingService: SpendingsService,
    private router: Router,
    private statisticSpendingService: StatisticStateService,
    private spendingsHelperService: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
    ) { }

    public ngOnInit(): void {
      this.route.paramMap.subscribe(async paramMap => {
        this.categoryId = paramMap.get('id');
        await this.loadCategoryData(this.categoryId);
      });
    }
  
    private async loadCategoryData(categoryId: string): Promise<void> {
      const category: Category = await this.spendingService.findCategoryById(categoryId);
      
      this.spendingService.getAllSpendings().subscribe(async (spendings) => {
        const spendingsByCategory = this.spendingService.findSpendingsByCategoryIncludeChildren(spendings, category);
        this.categoryData = await this.spendingsHelperService.calculateCategoryStatisticByCategory(spendingsByCategory, category);
        this.cdr.detectChanges();
      });
      
      console.log(category);
    }

  public prevRoute(): void {
    if(this.statisticSpendingService.prevRoute) {
      this.router.navigate([this.statisticSpendingService.prevRoute.path]);
    } else {
      this.router.navigate(['statistic']);
    }
  }

  public onCardClick(id: string): void {
    this.router.navigate(['/statistic/details', id]);
  }
}
