import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResizableComponent } from './components/resizable/resizable.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { MaterialModule } from './material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DonatChartComponent } from './components/donat-chart/donat-chart.component';


export const COMPONENTS = [
  ResizableComponent,
  NotFoundComponent,
  DonatChartComponent,
];

@NgModule({
  declarations: [
    ...COMPONENTS,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    ...COMPONENTS,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class UiModule { }
