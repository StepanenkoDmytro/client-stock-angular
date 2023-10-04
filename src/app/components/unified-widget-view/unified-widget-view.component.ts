import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'unified-widget-view',
  templateUrl: './unified-widget-view.component.html',
  styleUrls: ['./unified-widget-view.component.scss']
})
export class UnifiedWidgetViewComponent implements OnInit {

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
