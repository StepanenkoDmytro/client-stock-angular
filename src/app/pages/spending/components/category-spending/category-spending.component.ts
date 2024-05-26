import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Category } from '../../../../domain/category.domain';
import { CategorySpendingCardComponent } from './category-spending-card/category-spending-card.component';
import { ICategoryStatistic } from '../../../statistic/model/SpendindStatistic';
import { Spending } from '../../model/Spending';
import { RouterModule } from '@angular/router';
import { SpendingCategoryHelperService } from '../../../../service/helpers/spending-category-helper.service';


@Component({
  selector: 'pgz-category-spending',
  standalone: true,
  imports: [CategorySpendingCardComponent, RouterModule],
  templateUrl: './category-spending.component.html',
  styleUrl: './category-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingComponent implements OnInit {
  @Input()
  public spendings: Spending[];
  public spendingCategories: ICategoryStatistic[];

  @Input()
  public categories: Category[];

  constructor(
    private spendingCategoryHelper: SpendingCategoryHelperService,
    private cdr: ChangeDetectorRef
  ) { }

  public async ngOnInit(): Promise<void> {
    this.spendingCategories = await this.spendingCategoryHelper.calculateCategoryStatistic(this.spendings);
    this.cdr.detectChanges();
  }
}
