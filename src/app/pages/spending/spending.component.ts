import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProgressComponent } from '../../core/UI/components/progress/progress.component';
import { MatButtonModule } from '@angular/material/button';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { HistorySpendingComponent } from './components/history-spending/history-spending.component';
import { ID3Value, SimpleDataModel } from '../../domain/d3.domain';
import { SpendingsService } from '../../service/spendings.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TotalBalanceSpendingComponent } from './components/total-balance-spending/total-balance-spending.component';
import { Spending } from './model/Spending';
import { combineLatest } from 'rxjs';
import { CategorySpendingComponent } from './components/category-spending/category-spending.component';
import { Category } from '../../domain/category.domain';


const UI_COMPONENTS = [
  ProgressComponent,
  TotalBalanceSpendingComponent,
  CategorySpendingComponent,
  HistorySpendingComponent,
  ButtonToggleComponent,
];

const MATERIAL_MODULES = [
  MatButtonModule,
  MatIconModule,
];

@Component({
  selector: 'pgz-spending',
  templateUrl: './spending.component.html',
  styleUrl: './spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ ...UI_COMPONENTS, ...MATERIAL_MODULES, RouterModule],
})
export class SpendingComponent implements OnInit {
  public expends: ID3Value = {
    title: 'Spending by day',
    money: 0,
  };

  public spendings: Spending[];
  public categories: Category[];
  public isSpendingsFrame: boolean = true;

  public spendingsDataModel: SimpleDataModel[];

  constructor(
    private spendingsService: SpendingsService,
    // private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.spendingsService.init(); 
    combineLatest([
      this.spendingsService.getSpentByDay(),
      this.spendingsService.loadByCurrentMonth(),
      this.spendingsService.getAllCategories()
    ]).subscribe(([spentByDay, spendings, categories]) => {
      this.expends = {...this.expends, money: spentByDay};
      this.spendings = [...spendings];
      this.categories = categories[1].children;
      // console.log(this.categories);
      // this.cdr.detectChanges();
    });
  }

  public onChangeFrame(frame: boolean): void {
    this.isSpendingsFrame = frame;
  }
}
