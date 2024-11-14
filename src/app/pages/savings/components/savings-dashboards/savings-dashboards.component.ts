import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentRef, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { SavingsDashboardsService } from './service/savings-dashboards.service';
import { SwipeModule, SwipeEvent } from 'ng-swipe';
import { AsyncPipe, CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'pgz-savings-dashboards',
  standalone: true,
  imports: [SwipeModule, CommonModule, AsyncPipe],
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
  @ViewChild('slider') slider: ElementRef;

  currentIndex = 0;
  swipeOffset = new BehaviorSubject<number>(0);
  cardComponents: any[] = [];
  componentRefs: ComponentRef<any>[] = [];

  constructor(
    private cardService: SavingsDashboardsService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ) {}

  onSwipeMove(event: SwipeEvent) {
    const moveDistance = -this.currentIndex * 100 + (event.distance / window.innerWidth) * 100;
    this.renderer.setStyle(this.slider.nativeElement, 'transform', `translateX(${moveDistance}%)`);
  }

  onSwipeEnd(event: SwipeEvent) {
    const threshold = 50; // Поріг для перемикання - 50% ширини контейнера
    const maxIndex = this.cardComponents.length - 1;
  
    // Визначаємо відсоток пройденого шляху
    const swipePercentage = (Math.abs(event.distance) / window.innerWidth) * 100;
  
    // Перемикання карток, якщо свайп пройшов більше 50% ширини екрану
    if (swipePercentage > threshold) {
      if (event.distance < 0 && this.currentIndex < maxIndex) {
        this.currentIndex++; // Свайп вліво - перемикання на наступну картку
      } else if (event.distance > 0 && this.currentIndex > 0) {
        this.currentIndex--; // Свайп вправо - перемикання на попередню картку
      }
    }
  
    // Після завершення свайпу переміщаємо на нову картку
    const finalOffset = -this.currentIndex * 100; // Зсув у відсотках
    this.renderer.setStyle(this.slider.nativeElement, 'transform', `translateX(${finalOffset}%)`);
  }
  

  ngOnInit(): void {
    this.userCards.forEach(card => {
      const cardRef = this.cardService.getCardComponent(card);
      this.cardComponents.push(cardRef);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeCard'] && changes['activeCard'].currentValue) {
      this.currentIndex = Array.from(this.userCards).indexOf(changes['activeCard'].currentValue);
      this.renderer.setStyle(this.slider.nativeElement, 'transform', `translateX(${-this.currentIndex * 100}%)`);
    }
  }
}
