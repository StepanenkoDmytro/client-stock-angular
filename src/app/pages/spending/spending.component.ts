import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProgressComponent } from '../../core/UI/components/progress/progress.component';
import { MatButtonModule } from '@angular/material/button';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { HistorySpendingComponent } from './components/history-spending/history-spending.component';
import { ID3Value, SimpleDataModel } from '../../domain/d3.domain';
import { SpendingsService } from '../../service/spendings.service';
import { MatIconModule } from '@angular/material/icon';
import { Route, Router, RouterModule } from '@angular/router';
import { TotalBalanceSpendingComponent } from './components/total-balance-spending/total-balance-spending.component';
import { DEFAULT_SPENDING_CURRENCY, Spending } from './model/Spending';
import { combineLatest, switchMap, take } from 'rxjs';
import { CategorySpendingComponent } from './components/category-spending/category-spending.component';
import { Category } from '../../domain/category.domain';
import { SwipeWrapperComponent } from '../../core/UI/components/swipe-wrapper/swipe-wrapper.component';
import { PageHeaderComponent } from '../../core/UI/components/page-header/page-header.component';
import { AddTriggerService } from '../../service/helpers/add-trigger.service';
import { FxRateService } from '../../service/fx-rate.service';
import { UserPreferencesService } from '../savings/service/user-preferences.service';


const UI_COMPONENTS = [
  ProgressComponent,
  TotalBalanceSpendingComponent,
  CategorySpendingComponent,
  HistorySpendingComponent,
  ButtonToggleComponent,
  PageHeaderComponent,
  SwipeWrapperComponent
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

  public swipeComponents: any[] = [];

  private readonly destroyRef = inject(DestroyRef);
  private readonly fxRate = inject(FxRateService);
  private readonly userPrefs = inject(UserPreferencesService);

  constructor(
    private spendingsService: SpendingsService,
    private addTriggerService: AddTriggerService,
    private router: Router
  ) { }

  public ngOnInit(): void {
    this.spendingsService.init();

    this.swipeComponents = [
      CategorySpendingComponent,
      HistorySpendingComponent
    ];

    // Preload FX rates for every currency present in this user's spendings,
    // so downstream sync aggregators (TotalBalanceService, SpendingCategoryHelper)
    // can resolve conversions without I/O.
    this.spendingsService.getAllSpendings()
      .pipe(
        take(1),
        switchMap(spendings => {
          const base = this.userPrefs.baseCurrency() ?? DEFAULT_SPENDING_CURRENCY;
          const currencies = Array.from(new Set(
            spendings.map(s => s.currency).filter((c): c is string => !!c),
          ));
          return this.fxRate.preload(base, currencies);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.spendingsService.getSpentByDay()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(spent => this.expends = {...this.expends, money: spent});

    this.addTriggerService.buttonClick$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((path) => {
        if(path == '/spending') {
          this.router.navigate(['/spending/add']);
          this.addTriggerService.resetButtonClick();
        }
      });
  }

  public onChangeFrame(frame: boolean): void {
    this.isSpendingsFrame = frame;
  }
}
