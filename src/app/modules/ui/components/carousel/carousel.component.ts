import { Component, Input, OnInit } from '@angular/core';
import { trigger, transition, state, animate, style } from '@angular/animations';


export interface Item {
  id: number,
  isActive: boolean,
}

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  animations: [
    trigger('state', [
      state('active', style({
        transform: 'translatScale(1.1)' 
      })),
      state('inactive', style({
        transform: 'translatScale(1)' 
      })),
      transition('* => *', animate('2s ease-in-out')), 
    ]),
  ],
  
})
export class CarouselComponent implements OnInit {

  @Input()
  public items: Item[] = [];

  state: boolean = false;

  public activeIndex: number = 1;
  public visibleItems: Item[] = [];

  public ngOnInit(): void {
    this.changeVisibleItems(this.activeIndex);
  }

  public changeVisibleItems(itemID: number): void {
    this.state = !this.state;
    const itemCount = this.items.length;
    const currentItemIndex = this.items.findIndex(item => item.id === itemID);
    const lastItem = this.items.length - 1;


    if (currentItemIndex === 0) {
      this.visibleItems = this.items.slice(currentItemIndex, currentItemIndex + 2);
      this.visibleItems.unshift(this.items[lastItem]);
    }

    if (currentItemIndex > 0 && currentItemIndex < itemCount - 1) {
      this.visibleItems = this.items.slice(currentItemIndex - 1, currentItemIndex + 2);
    }

    if (currentItemIndex === itemCount - 1) {
      this.visibleItems = this.items.slice(currentItemIndex - 1, currentItemIndex + 2);
      this.visibleItems.push(this.items[0]);
    }

    this.activeIndex = this.visibleItems.findIndex(item => item.id === this.items[currentItemIndex].id)
  }
}
