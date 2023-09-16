import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResizableComponent } from './components/resizable/resizable.component';


@NgModule({
  declarations: [
    ResizableComponent,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ResizableComponent,
  ]
})
export class UiModule { }
