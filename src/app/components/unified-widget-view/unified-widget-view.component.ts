import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MNY_WIDGET } from 'src/app/domain/default-widget-state.domain';
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
  public finalWidget: string = MNY_WIDGET;
  public workComponents: string[] = [];
  private idComponent: string = '';
  private nameWidget: string = '';


  constructor(private router: Router,
    private unifiedWidgetState: UnifiedWidgetStateService) { }

  public ngOnInit(): void {
    const currentURL = this.router.url.substring(1);
    this.isFullComponent = this.linkComponent === currentURL;

    this.nameWidget = this.linkComponent; 
    console.log(this.nameWidget);

    this.unifiedWidgetState.loadState(this.nameWidget).subscribe(state => {
      console.log(state);
      
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
