import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentRef, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { SavingsDashboardsService } from './service/savings-dashboards.service';
import { SwipeModule, SwipeEvent } from 'ng-swipe';
import { AsyncPipe, CommonModule } from '@angular/common';
import { SwipeWrapperComponent } from '../../../../core/UI/components/swipe-wrapper/swipe-wrapper.component';

@Component({
  selector: 'pgz-savings-dashboards',
  standalone: true,
  imports: [SwipeWrapperComponent],
  templateUrl: './savings-dashboards.component.html',
  styleUrl: './savings-dashboards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavingsDashboardsComponent implements OnInit, OnChanges {
  @Input()
  public activeCard: string;
  @Input() 
  public userCards: Set<string>;

  currentIndex = 0;
  cardComponents: any[] = [];

  constructor(
    private cardService: SavingsDashboardsService,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.userCards.forEach(card => {
      const cardRef = this.cardService.getCardComponent(card);
      this.cardComponents.push(cardRef);
    });

    this.cdr.detectChanges();
  }


  //TODO: переписати, коли буде зрозуміло як треба перемикати chipsets для типів активів
  public ngOnChanges(changes: SimpleChanges): void {
    // if (changes['activeCard'] && changes['activeCard'].currentValue) {
    //   this.currentIndex = Array.from(this.userCards).indexOf(changes['activeCard'].currentValue);
    //   this.renderer.setStyle(this.slider.nativeElement, 'transform', `translateX(${-this.currentIndex * 100}%)`);
    // }
  }
}
