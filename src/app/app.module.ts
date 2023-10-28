import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StockPortfolioComponent } from './pages/stock-portfolio/stock-portfolio.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { DepositWalletComponent } from './dialog/deposit-wallet.dialog/deposit-wallet.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StockMarketComponent } from './pages/stock-portfolio/stock-market/stock-market.component';
import { DonatChartComponent } from './d3/donat-chart/donat-chart.component';
import { AreaChartComponent } from './d3/area-chart/area-chart.component';
import { StockDetailsComponent } from './pages/stock-portfolio/stock-market/stock-details/stock-details.component';
import { StockPickComponent } from './pages/stock-portfolio/stock-market/stock-pick/stock-pick.component';
import { HoldingsStockComponent } from './pages/stock-portfolio/holdings-stock/holdings-stock.component';
import { TradeStockComponent } from './pages/stock-portfolio/stock-market/trade-stock/trade-stock.component';
import { ExpandedInfoComponent } from './pages/stock-portfolio/holdings-stock/expanded-info/expanded-info.component';
import { DateFormatPipe } from './pipe/date-format.pipe';
import { DynamicInfoComponent } from './pages/stock-portfolio/dynamic-info/dynamic-info.component';
import { TotalInfoWrapperComponent } from './pages/stock-portfolio/total-info-wrapper/total-info-wrapper.component';
import { CommoditiesTableComponent } from './pages/stock-portfolio/dynamic-info/commodities-table/commodities-table.component';
import { ProfitTableComponent } from './pages/stock-portfolio/dynamic-info/profit-table/profit-table.component';
import { IndexCardComponent } from './pages/stock-portfolio/dynamic-info/index-card/index-card.component';
import { TransactionsHistoryComponent } from './pages/stock-portfolio/holdings-stock/expanded-info/transactions-history/transactions-history.component';
import { OverviewCompanyComponent } from './pages/stock-portfolio/holdings-stock/expanded-info/overview-company/overview-company.component';
import { TotalInfoCardComponent } from './pages/stock-portfolio/total-info-wrapper/total-info-card/total-info-card.component';
import { UiModule } from './modules/ui/ui.module';
import { CarouselComponent } from './components/carousel/carousel.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { UnifiedWidgetViewComponent } from './components/unified-widget-view/unified-widget-view.component';
import { ToolsManagerComponent } from './components/tools-manager/tools-manager.component';
import { StockPageComponent } from './pages/stock-page/stock-page.component';
import { HttpClientModule } from '@angular/common/http';
import { CreditCardComponent } from './components/card-wrapper/credit-card/credit-card.component';
import { CardWrapperComponent } from './components/card-wrapper/card-wrapper.component';
import { BudgetTrackerComponent } from './pages/portfolio/category-finances/budget-tracker-wrapper/budget-tracker/budget-tracker.component';
import { NonCreditCardComponent } from './components/non-credit-card/non-credit-card.component';
import { ExpendCalendarComponent } from './pages/portfolio/mny-expend-calendar/expend-calendar/expend-calendar.component';
import { SelectorComponent } from './pages/portfolio/mny-expend-calendar/expend-calendar/selector/selector.component';
import { SavingsGoalComponent } from './pages/portfolio/mny-targets/savings-goal/savings-goal.component';
import { DonatChartComponentV2 } from './d3/donat-chart-v2/donat-chart.component';
import { MnyPageMenuComponent } from './pages/portfolio/mny-page-wrapper/mny-page-menu/mny-page-menu.component';
import { MnyPageWrapperComponent } from './pages/portfolio/mny-page-wrapper/mny-page-wrapper.component';
import { CategoryFinancesComponent } from './pages/portfolio/category-finances/category-finances.component';
import { MnyExpendCalendarComponent } from './pages/portfolio/mny-expend-calendar/mny-expend-calendar.component';
import { MnyTargetsComponent } from './pages/portfolio/mny-targets/mny-targets.component';
import { DayViewComponent } from './pages/portfolio/mny-expend-calendar/day-view/day-view.component';
import { HeaderComponent } from './components/header/header.component';
import { BudgetTrackerWrapperComponent } from './pages/portfolio/category-finances/budget-tracker-wrapper/budget-tracker-wrapper.component';
import { InputCalculatorComponent } from './components/input-calculator/input-calculator.component';


@NgModule({
  declarations: [
    AppComponent,
    StockPortfolioComponent,
    PortfolioComponent,
    DepositWalletComponent,
    StockMarketComponent,
    DonatChartComponent,
    DonatChartComponentV2,
    AreaChartComponent,
    StockDetailsComponent,
    StockPickComponent,
    HoldingsStockComponent,
    TradeStockComponent,
    ExpandedInfoComponent,
    DateFormatPipe,
    DynamicInfoComponent,
    TotalInfoWrapperComponent,
    CommoditiesTableComponent,
    ProfitTableComponent,
    IndexCardComponent,
    TransactionsHistoryComponent,
    OverviewCompanyComponent,
    TotalInfoCardComponent,
    CarouselComponent,
    UnifiedWidgetViewComponent,
    ToolsManagerComponent,
    StockPageComponent,
    CreditCardComponent,
    CardWrapperComponent,
    BudgetTrackerComponent,
    NonCreditCardComponent,
    ExpendCalendarComponent,
    SelectorComponent,
    SavingsGoalComponent,
    MnyPageMenuComponent,
    MnyPageWrapperComponent,
    CategoryFinancesComponent,
    MnyExpendCalendarComponent,
    MnyTargetsComponent,
    DayViewComponent,
    HeaderComponent,
    BudgetTrackerWrapperComponent,
    InputCalculatorComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    DragDropModule,
    AppRoutingModule,
    NoopAnimationsModule,
    ReactiveFormsModule,
    UiModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
