import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { IAccount } from 'src/app/domain/account.domain';
import { ACCOUNTS_MOCK } from 'src/app/domain/mock.domain';


@Component({
  selector: 'app-deposit-wallet',
  templateUrl: './deposit-wallet.component.html',
  styleUrls: ['./deposit-wallet.component.scss']
})
export class DepositWalletComponent {

  public accounts: IAccount[] = ACCOUNTS_MOCK;
  public depositSumCtrl: FormControl = new FormControl(0, [Validators.required]);
}
