import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TotalInfoComponent } from './components/total-info/total-info.component';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import {MatIconModule} from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';
import { IAsset, IPortfolioStock } from '../../domain/savings.domain';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AddAssetsComponent } from './components/add-assets/add-assets.component';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { SavingsService } from '../../service/savings.service';
import { AddAssetCardComponent } from './components/add-asset-card/add-asset-card.component';
import { switchMap } from 'rxjs';


const UI_COMPONENTS = [
  TotalInfoComponent,
  ButtonToggleComponent,
  ButtonToggleComponent,
  AddAssetCardComponent
];

const MATERIAL_MODULES = [
  MatIconModule,
  MatTabsModule,
  MatFormFieldModule,
  MatButtonModule,
  MatBottomSheetModule
];

@Component({
  selector: 'pgz-savings',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
  templateUrl: './savings.component.html',
  styleUrl: './savings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsComponent implements OnInit {
  public assets: IAsset[];
  public isPortfolioFrame: boolean = true;

  constructor(
    private savingsService: SavingsService,
    private _bottomSheet: MatBottomSheet,
    private cdr: ChangeDetectorRef, 
  ) { }
  
  public ngOnInit(): void {
    this.savingsService.getAll().subscribe(portfolio => {
      this.assets = portfolio;
    });
  }

  public onChangeFrame(frame: boolean): void {
    this.isPortfolioFrame = frame;
  }

  public addSaving(): void {
    this._bottomSheet.open(AddAssetsComponent).afterDismissed().pipe(
      switchMap(() => this.savingsService.getAll())
    ).subscribe(portfolio => {
      this.assets = portfolio;
      this.cdr.detectChanges();
    });
  }
}
