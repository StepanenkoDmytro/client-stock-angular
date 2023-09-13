import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { IPortfolio } from 'src/app/domain/portfolio.domain';
import { ACCOUNTS_MOCK } from 'src/app/domain/mock.domain';


@Component({
  selector: 'app-deposit-wallet',
  templateUrl: './deposit-wallet.component.html',
  styleUrls: ['./deposit-wallet.component.scss']
})
export class DepositWalletComponent {

  public accounts: IPortfolio[] = ACCOUNTS_MOCK;
  public depositSumCtrl: FormControl = new FormControl(0, [Validators.required]);
}
