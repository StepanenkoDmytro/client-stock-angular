import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { ICategoryStatistic } from '../../../../statistic/model/SpendindStatistic';
import { Category } from '../../../../../domain/category.domain';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'pgz-category-spending-card',
  standalone: true,
  imports: [IconComponent, MatExpansionModule],
  templateUrl: './category-spending-card.component.html',
  styleUrl: './category-spending-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingCardComponent implements OnInit {
  @Input()
  public data: ICategoryStatistic;

  public dataChildrens: ICategoryStatistic[];
  public panelOpenState: boolean = false;

  public ngOnInit(): void {
    this.dataChildrens = this.data.children;
  }
}
