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
import { ReactiveFormsModule } from '@angular/forms';
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

import { DymanicInfoComponent } from './pages/stock-portfolio/dynamic-info/dynamic-info.component';
import { TotalInfoWrapperComponent } from './pages/stock-portfolio/dynamic-info/total-info-wrapper/total-info-wrapper.component';


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
    DymanicInfoComponent,
    TotalInfoWrapperComponent,
  ],
  imports: [
    BrowserModule,
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
    AppRoutingModule,
    NoopAnimationsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
