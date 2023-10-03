import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StockPortfolioComponent } from './pages/stock-portfolio/stock-portfolio.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { MatDialogModule } from '@angular/material/dialog';
import { DepositWalletComponent } from './dialog/deposit-wallet.dialog/deposit-wallet.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { StockMarketComponent } from './pages/stock-portfolio/stock-market/stock-market.component';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { DonatChartComponent } from './d3/donat-chart/donat-chart.component';
import { AreaChartComponent } from './d3/area-chart/area-chart.component';
import { StockDetailsComponent } from './pages/stock-portfolio/stock-market/stock-details/stock-details.component';
import { StockPickComponent } from './pages/stock-portfolio/stock-market/stock-pick/stock-pick.component';
import { HoldingsStockComponent } from './pages/stock-portfolio/holdings-stock/holdings-stock.component';
import { TradeStockComponent } from './pages/stock-portfolio/stock-market/trade-stock/trade-stock.component';
import { ExpandedInfoComponent } from './pages/stock-portfolio/holdings-stock/expanded-info/expanded-info.component';
import { DateFormatPipe } from './pipe/date-format.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
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
import { PrimaryVisibleComponent } from './components/primary-visible/primary-visible.component';
import { ToolsManagerComponent } from './components/tools-manager/tools-manager.component';


@NgModule({
  declarations: [
    AppComponent,
    StockPortfolioComponent,
    PortfolioComponent,
    DepositWalletComponent,
    StockMarketComponent,
    DonatChartComponent,
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
    PrimaryVisibleComponent,
    ToolsManagerComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatSidenavModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatCardModule,
    MatMenuModule,
    MatExpansionModule,
    DragDropModule,
    AppRoutingModule,
    NoopAnimationsModule,
    ReactiveFormsModule,
    UiModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
