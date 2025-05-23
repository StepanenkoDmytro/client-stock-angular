import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, QueryList, Renderer2, ViewChild, ViewChildren, ViewContainerRef } from '@angular/core';
import { SwipeEvent, SwipeModule } from 'ng-swipe';
@Component({
  selector: 'pgz-swipe-wrapper',
  standalone: true,
  imports: [SwipeModule, CommonModule],
  templateUrl: './swipe-wrapper.component.html',
  styleUrl: './swipe-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwipeWrapperComponent {
  @Input() 
  public cards: any[] = [];
  @Input()
  public isVisibleDots: boolean = false;

  @Output() 
  public currentIndexChange = new EventEmitter<number>();

  @ViewChild('slider') slider: ElementRef;

  public currentIndex = 0;
  public isVerticalMove: boolean = false;
  
  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {}

  public onSwipeMove(event: SwipeEvent): void {
    if(event.direction === 'y') {
      this.isVerticalMove = true;
      return;
    } else {
      this.isVerticalMove = false;
    }

    if (this.cards.length <= 1) {
      return; 
    }

    if (this.currentIndex === 0 && event.distance > 0) {
      return;
    }
  
    if (this.currentIndex === this.cards.length - 1 && event.distance < 0) {
      return;
    }

    const moveDistance = -this.currentIndex * 100 + (event.distance / window.innerWidth) * 100;
    this.renderer.setStyle(this.slider.nativeElement, 'transform', `translateX(${moveDistance}%)`);
  }

  public onSwipeEnd(event: SwipeEvent): void {
    if(this.isVerticalMove) {
      return;
    }

    if (this.cards.length <= 1) {
      return; 
    }

    const threshold = 50;
    const maxIndex = this.cards.length - 1;
  
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
    if(this.cards.length > 0) {
      const finalOffset = -this.currentIndex * 100;
      this.renderer.setStyle(this.slider.nativeElement, 'transform', `translateX(${finalOffset}%)`);
      this.cdr.detectChanges();
    }
  }
}
