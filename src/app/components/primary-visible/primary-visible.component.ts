import { CdkDialogContainer } from '@angular/cdk/dialog';
import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-primary-visible',
  templateUrl: './primary-visible.component.html',
  styleUrls: ['./primary-visible.component.scss']
})
export class PrimaryVisibleComponent {

  primaryComponents: string[] = [
    'chart',
    'commodities',
    // 'profit'
  ];

  workComponents: string[] = [
    'indices',
    'profit'
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
