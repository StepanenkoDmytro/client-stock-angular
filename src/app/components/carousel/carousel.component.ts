import { Component, Input, OnInit } from '@angular/core';
import { trigger, transition, state, animate, style } from '@angular/animations';
import { IPortfolio } from 'src/app/domain/portfolio.domain';


export interface Item {
  accountID: number,
  isActive: boolean,
}

export interface InputObject {
  portfolio: IPortfolio;
  accountID: number; // Додайте поле accountID з типом number
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
  public items: IPortfolio[] = [];
  @Input()
  public start: number = 1;

  public state: boolean = false;
  public visibleItems: IPortfolio[] = [];
  public leftIndexItem: number = 0;
  public rightIndexItem: number = 2;

  public ngOnInit(): void {
    this.changeVisibleItems(this.start);
  }

  public changeVisibleItems(itemID: number): void {
    if (!this.items || this.items.length === 0) {
      return;
    }

    this.state = !this.state;
    const itemCount = this.items.length;
    const currentItemIndex = this.items.findIndex(item => item.accountID === itemID);
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
    
    this.start = this.visibleItems.findIndex(item => item.accountID === this.items[currentItemIndex].accountID)
  }
}
