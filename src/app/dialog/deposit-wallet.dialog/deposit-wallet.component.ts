import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ACCOUNTS_MOCK, IAccount } from 'src/app/domain/account.domain';

@Component({
  selector: 'app-deposit-wallet',
  templateUrl: './deposit-wallet.component.html',
  styleUrls: ['./deposit-wallet.component.scss']
})
export class DepositWalletComponent implements OnInit {
  ngOnInit(): void {
    console.log(this.accounts);
  }
  public accounts: IAccount[] = ACCOUNTS_MOCK;
  public depositSumCtrl: FormControl = new FormControl(0, [Validators.required]);
}
