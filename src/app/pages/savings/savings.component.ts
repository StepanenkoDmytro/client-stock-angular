import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { IAsset } from '../../domain/savings.domain';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { SavingsService } from '../../service/savings.service';
import { AssetCardComponent } from './components/asset-card/asset-card.component';
import { Router, RouterModule } from '@angular/router';
import { TotalBalanceComponent } from '../../core/UI/components/total-balance/total-balance.component';
import { MarketService } from './service/market.service';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { SelectMarketDialogComponent } from './components/select-market-dialog/select-market-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SavingsDashboardsComponent } from './components/savings-dashboards/savings-dashboards.component';
import { AddTriggerService } from '../../service/helpers/add-trigger.service';


const UI_COMPONENTS = [
  TotalBalanceComponent,
  ButtonToggleComponent,
  ButtonToggleComponent,
  AssetCardComponent,
  SavingsDashboardsComponent
];

const MATERIAL_MODULES = [
  MatIconModule,
  MatTabsModule,
  MatFormFieldModule,
  MatButtonModule,
  MatBottomSheetModule,
  MatChipsModule
];


@Component({
  selector: 'pgz-savings',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES, RouterModule],
  templateUrl: './savings.component.html',
  styleUrl: './savings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsComponent implements OnInit {
  readonly dialog = inject(MatDialog);

  public assets: IAsset[];
  public filteredAssets: IAsset[];
  public filters: Set<string> = new Set<string>();
  public selectedFilter: string = 'All';
  public isPortfolioFrame: boolean = true;

  constructor(
    private assetStateService: MarketService,
    private savingsService: SavingsService,
    private addTriggerService: AddTriggerService,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.savingsService.init();
    this.savingsService.getAll().subscribe(portfolio => {
      this.assets = portfolio;
      this.filteredAssets = portfolio;
      this.getAssetTypes();
    });

    this.addTriggerService.buttonClick$.subscribe((path) => {
      if(path === '/savings') {
        this.openSelectedFilter();
        this.addTriggerService.resetButtonClick();
      }
    });
  }

  public toggleChip(chipName: string): void {
    this.selectedFilter = chipName;
    this.filterAssets();
  }

  public isSelected(chipName: string): boolean {
    return this.selectedFilter === chipName;
  }
  
  public onChangeFrame(frame: boolean): void {
    // TODO: rename
    this.isPortfolioFrame = frame;
  }

  public onDeleteAsset(asset: IAsset): void {
    this.savingsService.deleteSaving(asset);
  }

  public onEditAsset(asset: IAsset): void {
    this.assetStateService.selectPortfolioAsset(asset);
    const newRoute = '/savings/' + asset.assetType.toLocaleLowerCase() + '-asset';
    this.router.navigate([newRoute]);
  }

  public openSelectedFilter(): void {
    if(this.selectedFilter === 'All') {
      const dialogRef = this.dialog.open(SelectMarketDialogComponent);

      dialogRef.afterClosed().subscribe(result => {
        if(result) {
          this.selectedFilter = result;
          this.openSelectedFilter();      
        }
      });
    } else {
      this.router.navigate(['savings/',this.selectedFilter.toLocaleLowerCase()]);
    }
  }

  public selectedFilterMarket(): string {
    if(this.selectedFilter === 'All') {
      return 'Select Market';
    } else {
      return this.selectedFilter + ' Market';
    }
  }

  private getAssetTypes(): void {
    this.filters.clear();
    this.filters.add('All');
    this.assets.forEach(asset => {
      this.filters.add(asset.assetType);
    });
  }

  private filterAssets(): void {
    if (this.selectedFilter === 'All') {
      this.filteredAssets = [...this.assets];
    } else {
      this.filteredAssets = this.assets.filter(asset => asset.assetType === this.selectedFilter);
    }
  }
}
