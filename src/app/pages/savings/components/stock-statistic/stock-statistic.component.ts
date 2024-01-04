import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BarComponent } from '../../../../core/UI/components/charts/bar/bar.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';


const UI_COMPONENTS = [
  BarComponent
];

const MATERIAL_MODULES = [
  MatTabsModule,
  MatExpansionModule,
  MatIconModule
];

@Component({
  selector: 'pgz-stock-statistic',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
  templateUrl: './stock-statistic.component.html',
  styleUrl: './stock-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockStatisticComponent {
  public years: string[] = ['2022', '2023', '2024'];
  public months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  public trackYear(year: string): string {
    return year;
  }
}
