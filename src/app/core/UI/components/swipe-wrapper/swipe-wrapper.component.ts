import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, QueryList, Renderer2, ViewChild, ViewChildren, ViewContainerRef } from '@angular/core';
import { SwipeEvent, SwipeModule } from 'ng-swipe';
@Component({
  selector: 'pgz-swipe-wrapper',
  standalone: true,
  imports: [SwipeModule, CommonModule, AsyncPipe],
  templateUrl: './swipe-wrapper.component.html',
  styleUrl: './swipe-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwipeWrapperComponent {
  @Input() set cards(items: any[]) {
    this._cards = items;
    console.log(items);
  }

  _cards: any[] = [];
  @Output() currentIndexChange = new EventEmitter<number>();

  
  @ViewChildren('cardContainer', { read: ViewContainerRef }) cardContainers!: QueryList<ViewContainerRef>; // Отримуємо доступ до всіх контейнерів
  @ViewChild('slider') slider: ElementRef;

  currentIndex = 0;
  public cardComponents: any[] = [];
  
  constructor(
    private renderer: Renderer2,
  ) {}

  public onSwipeMove(event: SwipeEvent) {
    if (this._cards.length <= 1) {
      return; 
    }

    const moveDistance = -this.currentIndex * 100 + (event.distance / window.innerWidth) * 100;
    this.renderer.setStyle(this.slider.nativeElement, 'transform', `translateX(${moveDistance}%)`);
  }

  public onSwipeEnd(event: SwipeEvent) {
    if (this._cards.length <= 1) {
      return; 
    }

    const threshold = 50;
    const maxIndex = this._cards.length - 1;
  
    const swipePercentage = (Math.abs(event.distance) / window.innerWidth) * 100;
  
    if (swipePercentage > threshold) {
      if (event.distance < 0 && this.currentIndex < maxIndex) {
        this.currentIndex++;
      } else if (event.distance > 0 && this.currentIndex > 0) {
        this.currentIndex--;
      }
    }
    
    this.updateSliderPosition();
    this.currentIndexChange.emit(this.currentIndex);
  }

  private updateSliderPosition(): void {
    
    if(this._cards.length > 0) {
      
      const finalOffset = -this.currentIndex * 100;
      this.renderer.setStyle(this.slider.nativeElement, 'transform', `translateX(${finalOffset}%)`);
    }
  }

}
