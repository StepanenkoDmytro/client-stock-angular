import { ChangeDetectionStrategy, Component, ComponentFactoryResolver, ComponentRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { SavingsDashboardsService } from './service/savings-dashboards.service';

@Component({
  selector: 'pgz-savings-dashboards',
  standalone: true,
  imports: [],
  templateUrl: './savings-dashboards.component.html',
  styleUrl: './savings-dashboards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavingsDashboardsComponent implements OnInit, OnChanges {
  @Input()
  public activeCard: string;
  @Input() 
  public userCards: Set<string>;
  @ViewChild('cardContainer', { read: ViewContainerRef, static: true }) cardContainer: ViewContainerRef;

  currentIndex = 0;
  cardComponents: any[] = [];
  componentRefs: ComponentRef<any>[] = [];

  constructor(
    private cardService: SavingsDashboardsService
  ) {}

  public ngOnInit(): void {
    this.userCards.forEach(card => {
      const cardRef = this.cardService.getCardComponent(card);
      this.cardComponents.push(cardRef);
    });

    this.loadComponent(this.activeCard);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeCard'] && changes['activeCard'].currentValue) {
      this.loadComponent(changes['activeCard'].currentValue);
    }
  }

  loadComponent(cardName: string) {
    this.cardContainer.clear();  
    const cardRef = this.cardService.getCardComponent(cardName);
    const componentRef = this.cardContainer.createComponent(cardRef);
    this.componentRefs.push(componentRef);
  }
}
