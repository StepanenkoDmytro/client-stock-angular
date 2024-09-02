import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { ICategoryStatistic } from '../../../model/SpendindStatistic';
import { Category } from '../../../../../domain/category.domain';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';

@Component({
  selector: 'pgz-spending-statistic-card',
  standalone: true,
  imports: [IconComponent, CommonModule, MatIconModule],
  templateUrl: './spending-statistic-card.component.html',
  styleUrl: './spending-statistic-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpendingStatisticCardComponent {
  @Input()
  public set data(value: ICategoryStatistic) {
    // console.log(value);
    this._data = value;
  }
  @Input()
  public set compareData(value: ICategoryStatistic) {
    this._compareData = value;
  }
  @Input()
  public isVisible: boolean = true;
  @Input()
  public isCompareMode: boolean = false;
  @Input()
  public startRange:moment.Moment;
  @Input()
  public startCompareRange:moment.Moment;

  @Output() 
  public toggleCategory: EventEmitter<string> = new EventEmitter();
  @Output()
  public clickCard: EventEmitter<Category> = new EventEmitter();

  public _data: ICategoryStatistic;
  public _compareData: ICategoryStatistic;

  public onToggleCategory(): void {
    this.isVisible = !this.isVisible;
    this.toggleCategory.emit(this._data.category.id);
  }

  public onClickCard(): void {
    this.clickCard.emit(this._data.category);
  }

  public isCardHaveData(): boolean {
    if(!this.isCompareMode) {
      return this._data.value > 0;
    }
    
    const isVisible = this._data.value > 0 || this._compareData.value > 0;
    return isVisible;
  }
}
