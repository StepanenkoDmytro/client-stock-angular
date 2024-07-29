import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { ICategoryStatistic } from '../../../model/SpendindStatistic';
import { Category } from '../../../../../domain/category.domain';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'pgz-spending-statistic-card',
  standalone: true,
  imports: [IconComponent, CommonModule, MatIconModule],
  templateUrl: './spending-statistic-card.component.html',
  styleUrl: './spending-statistic-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpendingStatisticCardComponent implements OnInit {
  @Input()
  public set data(value: ICategoryStatistic) {
    this._data = value;
  }
  @Input()
  public isVisible: boolean = true;

  public _data: ICategoryStatistic;

  @Output() 
  public toggleCategory: EventEmitter<string> = new EventEmitter();
  @Output()
  public clickCard: EventEmitter<Category> = new EventEmitter();

  public ngOnInit(): void {
    if(this._data.value === 0) {
      this.isVisible = false;
    }
  }

  public onToggleCategory(): void {
    this.isVisible = !this.isVisible;
    this.toggleCategory.emit(this._data.category.id);
  }

  public onClickCard(): void {
    this.clickCard.emit(this._data.category);
  }
}
