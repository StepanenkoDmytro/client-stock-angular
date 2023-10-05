import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UnifiedWidgetStateService } from 'src/app/service/unified-widget-state.service';

@Component({
  selector: 'unified-widget-view',
  templateUrl: './unified-widget-view.component.html',
  styleUrls: ['./unified-widget-view.component.scss']
})
export class UnifiedWidgetViewComponent implements OnInit {

  @Input()
  public linkComponent: string = '';
  public isFullComponent: boolean = false;
  public primaryComponents: string[] = [];
  public workComponents: string[] = [];
  private idComponent: string = '';
  private nameWidget: string = '';

  constructor(private router: Router,
    private unifiedWidgetState: UnifiedWidgetStateService) { }

  public ngOnInit(): void {
    const currentURL = this.router.url;
    this.isFullComponent = this.linkComponent === currentURL;

    this.nameWidget = this.linkComponent.substring(1); 
    console.log(this.nameWidget);

    this.unifiedWidgetState.loadState(this.nameWidget).subscribe(state => {
      this.primaryComponents = state.primary;
      this.workComponents = state.work;

      this.idComponent = state.id!;
      
    }, err => console.error(err));
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

    const newState = {
      id: this.idComponent,
      nameWidget: this.nameWidget,
      primary: this.primaryComponents,
      work: this.workComponents
    }

    this.unifiedWidgetState.updateState(newState).subscribe(state => {
      console.log(state);
      
    }, err => console.error(err))
  }
}
