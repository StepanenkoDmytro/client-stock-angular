import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ICategoryStatistic } from '../../model/SpendindStatistic';
import { MultiLineComponent } from '../../../../core/UI/components/charts/multi-line/multi-line.component';
import { PieChartComponent } from '../../../../core/UI/components/charts/pie-chart/pie-chart.component';
import { Category } from '../../../../domain/category.domain';
import { Router } from '@angular/router';
import { StatisticStateService } from '../../service/statistic-state.service';
import { SpendingStatisticCardComponent } from '../spending-statistic/spending-statistic-card/spending-statistic-card.component';
import { IDonutData } from '../../../../core/UI/components/charts/donut/donut.component';
import { SpendingCategoryHelperService } from '../../../../service/helpers/spending-category-helper.service';

const UI_COMPONENTS = [
  PieChartComponent,
  MultiLineComponent,
  SpendingStatisticCardComponent,
];

@Component({
  selector: 'pgz-statistic-charts-wrapper',
  standalone: true,
  imports: [...UI_COMPONENTS],
  templateUrl: './statistic-charts-wrapper.component.html',
  styleUrl: './statistic-charts-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticChartsWrapperComponent implements OnInit {
  @Input()
  public categoryData: ICategoryStatistic[] = [];

  public chartType: 'pie' | 'multiline' = 'pie';

  public pieChartData: IDonutData;

  constructor(
    private router: Router,
    private statisticStateHelper: StatisticStateService,
    private spendingsHelperService: SpendingCategoryHelperService
  ) { }

  public ngOnInit(): void {
    this.pieChartData = this.spendingsHelperService.mapCategoryStatisticToChartData(this.categoryData);
  }

  public toggleChart(): void {
    this.chartType = this.chartType === 'pie' ? 'multiline' : 'pie';
  }

  public onCardClick(category: Category): void {
    this.statisticStateHelper.addBreadCrumb(category);
    this.router.navigate(['/statistic/details', category.id]);
  }
}
