import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResizableComponent } from './components/resizable/resizable.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { MaterialModule } from './material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DonatChartComponent } from './components/donat-chart/donat-chart.component';
import { ButtonToggleComponent } from './components/button-toggle/button-toggle.component';

export const COMPONENTS = [
  ResizableComponent,
  NotFoundComponent,
  DonatChartComponent,
  ButtonToggleComponent,
];

@NgModule({
  declarations: [...COMPONENTS],
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  exports: [...COMPONENTS, MaterialModule, FormsModule, ReactiveFormsModule],
})
export class UiModule {}
