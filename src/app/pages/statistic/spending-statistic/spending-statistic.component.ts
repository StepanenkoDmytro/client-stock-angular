import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { BarComponent } from '../../../core/UI/components/charts/bar/bar.component';
import { SpendingsService } from '../../../service/spendings.service';
import { HistorySpendingCardComponent } from '../../spending/components/history-spending/history-spending-card/history-spending-card.component';
import { IBarData, IMonthlySpending, ISpendingHistory, IYearSpending } from '../../../domain/statistic.domain';
import { ChartsHelperService } from '../../../core/UI/components/charts/bar/charts-helper.service';
import { Spending } from '../../spending/model/Spending';
import { MultiLineComponent } from '../../../core/UI/components/charts/multi-line/multi-line.component';
import { DonutComponent } from '../../../core/UI/components/charts/donut/donut.component';
import { SimpleDataModel } from '../../../domain/d3.domain';


const UI_COMPONENTS = [
  DonutComponent,
  BarComponent,
  HistorySpendingCardComponent,
  MultiLineComponent,
];

const MATERIAL_MODULES = [
  MatTabsModule,
  MatExpansionModule,
  MatIconModule
];

@Component({
  selector: 'pgz-spending-statistic',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
  templateUrl: './spending-statistic.component.html',
  styleUrl: './spending-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpendingStatisticComponent {

  @Input()
  public set spendings(value: Spending[]) {
    this.donutData = this.chartsHelperService.spendingsMapToSimpleData(value);
  }

  public donutData: SimpleDataModel[];

  constructor(
    private chartsHelperService: ChartsHelperService,
  ) { }

}
