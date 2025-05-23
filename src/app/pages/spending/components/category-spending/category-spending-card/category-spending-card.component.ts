import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { ICategoryStatistic } from '../../../../statistic/model/SpendindStatistic';
import { Category } from '../../../../../domain/category.domain';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { EditStateService } from '../../../service/edit-state.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ArrowBackComponent } from '../../../../../core/UI/components/arrow-back/arrow-back.component';

const UI_MODULES = [
  IconComponent,
  ArrowBackComponent
];

const MATERIAL_MODULES = [
  MatExpansionModule, 
  MatIconModule, 
  MatMenuModule,
  CommonModule
];

@Component({
  selector: 'pgz-category-spending-card',
  standalone: true,
  imports: [...UI_MODULES, ...MATERIAL_MODULES],
  templateUrl: './category-spending-card.component.html',
  styleUrl: './category-spending-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySpendingCardComponent implements OnInit {
  @Input()
  public data: ICategoryStatistic;

  public dataChildrens: ICategoryStatistic[];
  public panelOpenState: boolean = false;

  constructor(
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.dataChildrens = this.data.children;
  }

  public onCardClick(): void {
  }

  

  // public onDelete(category: Category): void {
  //   this.onDeleteCategory.emit(category);
  // }
}
