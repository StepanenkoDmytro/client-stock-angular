import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SpendingCategoryHelperService } from '../../../../../service/helpers/spending-category-helper.service';
import { IDonutData } from '../../../../../core/UI/components/charts/donut/donut.component';
import { PieChartComponent } from '../../../../../core/UI/components/charts/pie-chart/pie-chart.component';
import { ICategoryStatistic } from '../../../model/SpendindStatistic';

@Component({
  selector: 'pgz-pie-chart-container',
  standalone: true,
  imports: [PieChartComponent],
  templateUrl: './pie-chart-container.component.html',
  styleUrl: '../spending-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieChartContainerComponent {
  @Input()
  public set categoryData(value: ICategoryStatistic[]) {
    if(!value) {
      return;
    }

    this.pieChartData = this.spendingsHelperService.mapCategoryStatisticToChartData(value);
  }

  @Input()
  public isCompareEnabled: boolean = false;

  @Input()
  public set compareCategoryData(value: ICategoryStatistic[]) {
    if(!value) {
      return;
    }

    this.comparePieChartData = this.spendingsHelperService.mapCategoryStatisticToChartData(value);
  }

  public pieChartData: IDonutData;
  public comparePieChartData: IDonutData;

  constructor(
    private spendingsHelperService: SpendingCategoryHelperService
  ) { }
}
