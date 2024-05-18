import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { BarComponent } from '../../../../core/UI/components/charts/bar/bar.component';
import { MatIconModule } from '@angular/material/icon';


const UI_COMPONENTS = [
  BarComponent,
];

const MATERIAL_MODULES = [
  MatTabsModule,
  MatExpansionModule,
  MatIconModule
];

@Component({
  selector: 'pgz-savings-statistic',
  standalone: true,
  imports: [...UI_COMPONENTS, ...MATERIAL_MODULES],
  templateUrl: './savings-statistic.component.html',
  styleUrl: './savings-statistic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavingsStatisticComponent {
  public years: string[] = ['2022', '2023', '2024'];
  public months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  public trackYear(index: number, year: string): string {
    return year;
  }
}
