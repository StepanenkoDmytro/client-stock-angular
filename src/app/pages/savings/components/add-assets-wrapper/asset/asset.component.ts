import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IAsset } from '../../../../../domain/savings.domain';
import { FormsModule } from '@angular/forms';
import { MarketStateService } from '../service/market-state.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';


const MATERIAL_MODULES = [
  MatIconModule, 
  FormsModule, 
  MatFormFieldModule, 
  MatInputModule
];

@Component({
  selector: 'pgz-asset',
  standalone: true,
  imports: [...MATERIAL_MODULES, IconComponent],
  templateUrl: './asset.component.html',
  styleUrl: './asset.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetComponent implements OnInit {
  public selectedAsset: IAsset;
  public editDisabled: boolean = true;
  
  constructor(
    private marketStateService: MarketStateService
  ) { }

  public ngOnInit(): void {
    this.selectedAsset = this.marketStateService.asset.value;
    console.log(this.selectedAsset);
  }
}
