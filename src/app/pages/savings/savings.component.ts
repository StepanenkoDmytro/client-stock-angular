import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ButtonToggleComponent } from '../../core/UI/components/button-toggle/button-toggle.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { IAsset } from '../../domain/savings.domain';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { SavingsService } from '../../service/savings.service';
import { AssetCardComponent } from './components/asset-card/asset-card.component';
import { RouterModule } from '@angular/router';
import { TotalBalanceComponent } from '../../core/UI/components/total-balance/total-balance.component';


const UI_COMPONENTS = [
  TotalBalanceComponent,
  ButtonToggleComponent,
  ButtonToggleComponent,
  AssetCardComponent
];

const MATERIAL_MODULES = [
  MatIconModule,
  MatTabsModule,
  MatFormFieldModule,
  MatButtonModule,
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

  public assets: IAsset[];
  public filteredAssets: IAsset[];
  public filters: Set<string> = new Set<string>();
  public selectedFilter: string = 'All';
  public isPortfolioFrame: boolean = true;

  constructor(
    private savingsService: SavingsService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.savingsService.getAll().subscribe(portfolio => {
      this.assets = portfolio;
      this.filteredAssets = portfolio;
      this.getAssetTypes();
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
