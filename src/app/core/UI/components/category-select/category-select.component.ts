import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { Category } from '../../../../domain/category.domain';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { MatButtonModule } from '@angular/material/button';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pgz-category-select',
  standalone: true,
  imports: [MatSelectModule, FormsModule, MatIconModule, MatFormFieldModule, MatInputModule, MatMenuModule, MatTreeModule, MatButtonModule, IconComponent],
  templateUrl: './category-select.component.html',
  styleUrl: './category-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySelectComponent {

  @ViewChild('menuTrigger', {read: MatMenuTrigger})
  private menuTrigger: MatMenuTrigger;


  public categories: Category[] = Category.defaultList;
  public selectedCategory: Category = Category.default;

  treeControl = new NestedTreeControl<Category>(node => node.children);
  dataSource = new MatTreeNestedDataSource<Category>();

  constructor() {
    this.dataSource.data = this.categories;
  }

  hasChild = (_: number, node: Category) => !!node.children && node.children.length > 0;

  public selectCategory(event: MouseEvent, category: Category): void {
    event.preventDefault();
    event.stopPropagation();

    this.selectedCategory = category;
    this.menuTrigger.closeMenu();
  }
}
