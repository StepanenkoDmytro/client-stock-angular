import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AddAssetCardComponent } from '../../add-asset-card/add-asset-card.component';
import { ACCOUNT_STOCKS_MOCK } from '../../../../../../domain/mock.domain';
import { IPortfolioStock } from '../../../../../../domain/savings.domain';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../service/stock.service';
import { HttpClientModule } from '@angular/common/http';


const UI_COMPONENTS = [
  AddAssetCardComponent
];

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  FormsModule,
]

@Component({
  selector: 'pgz-stock-market',
  standalone: true,
  imports: [UI_COMPONENTS, ...MATERIAL_MODULES, HttpClientModule],
  templateUrl: './stock-market.component.html',
  styleUrl: './stock-market.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [StockService]
})
export class StockMarketComponent implements OnInit {
  
  public value = 'Clear me';
  public stocks: IPortfolioStock[] = ACCOUNT_STOCKS_MOCK;

  constructor(private stockService: StockService) { }

  public ngOnInit(): void {
    this.stockService.getMovers('DAY_GAINERS').subscribe(
      (response) => {
        console.log('Success', response);
      },
    (error) => {
    console.error('Error', error);
  });
  }
}
