import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResizableComponent } from './components/resizable/resizable.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { MaterialModule } from './material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DonatChartComponent } from './components/d3/donat-chart/donat-chart.component';
import { ButtonToggleComponent } from './components/button-toggle/button-toggle.component';
import { BarChartComponent } from './components/d3/bar-chart/bar-chart.component';

export const COMPONENTS = [
  ResizableComponent,
  NotFoundComponent,
  DonatChartComponent,
  ButtonToggleComponent,
  BarChartComponent,
];

@NgModule({
  declarations: [...COMPONENTS],
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  exports: [...COMPONENTS, MaterialModule, FormsModule, ReactiveFormsModule],
})
export class UiModule {}
