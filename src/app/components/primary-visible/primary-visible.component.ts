import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-primary-visible',
  templateUrl: './primary-visible.component.html',
  styleUrls: ['./primary-visible.component.scss']
})
export class PrimaryVisibleComponent implements OnInit {

  @Input()
  public linkComponent: string = '';
  public isFullComponent: boolean = false;
  public primaryComponents: string[] = [
    'chart',
  ];
  public workComponents: string[] = [
    'indices',
    'profit',
    'commodities'
  ];

  constructor(private router: Router) { }

  public ngOnInit(): void {
    const currentURL = this.router.url;
    this.isFullComponent = this.linkComponent === currentURL;
    console.log(this.isFullComponent);
  }

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
