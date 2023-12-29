import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CoinService } from '../../../../service/coin.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'pgz-crypto-market',
  standalone: true,
  imports: [HttpClientModule],
  templateUrl: './crypto-market.component.html',
  styleUrl: './crypto-market.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CoinService]
})
export class CryptoMarketComponent implements OnInit {
  constructor(private coinService: CoinService) { }

  public ngOnInit(): void {
    this.coinService.getCoins().subscribe(
      (response) => {
        console.log('Success', response);
      },
    (error) => {
    console.error('Error', error);
  });
  }

}
