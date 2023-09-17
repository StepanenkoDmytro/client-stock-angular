import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DepositWalletComponent } from 'src/app/dialog/deposit-wallet.dialog/deposit-wallet.component';
import { Item } from 'src/app/modules/ui/components/carousel/carousel.component';


@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent {

  constructor(
    public dialogService: MatDialog
  ) { }

  public items: Item[] = [
    {
      id: 1,
      isActive: true,
    },
    {
      id: 2,
      isActive: false,
    },
    // {
    //   id: 3,
    // isActive: false,
    // },
    // {
    //   id: 4,
    // isActive: false,
    // },
  ];

  openDialog(): void {
    const config = new MatDialogConfig();
    config.autoFocus = true;
    config.disableClose = true;
    config.hasBackdrop = true;
    this.dialogService.open(DepositWalletComponent, config);
  }
}
