import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';

@Component({
  selector: 'app-primary-visible',
  templateUrl: './primary-visible.component.html',
  styleUrls: ['./primary-visible.component.scss']
})
export class PrimaryVisibleComponent {

  primaryComponents: string[] = [
    'chart',
  ];

  workComponents: string[] = [
    'indices',
    'profit',
    'commodities'
  ];

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}
