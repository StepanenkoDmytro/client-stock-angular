import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
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
import { Store, select } from '@ngrx/store';
import { categoriesSpendindSelector } from '../../../../pages/spending/store/spendings.selectors';

@Component({
  selector: 'pgz-category-select',
  standalone: true,
  imports: [MatSelectModule, FormsModule, MatIconModule, MatFormFieldModule, MatInputModule, MatMenuModule, MatTreeModule, MatButtonModule, IconComponent],
  templateUrl: './category-select.component.html',
  styleUrl: './category-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CategorySelectComponent),
    multi: true
  }]
})
export class CategorySelectComponent implements OnInit, ControlValueAccessor {
  @Input()
  public label: string = 'Category';
  public hasChild = (_: number, node: Category) => !!node.children && node.children.length > 0;
  @ViewChild('menuTrigger', {read: MatMenuTrigger})
  private menuTrigger: MatMenuTrigger;

  public categories: Category[];
  public selectedCategory: Category;

  public treeControl = new NestedTreeControl<Category>(node => node.children);
  public dataSource = new MatTreeNestedDataSource<Category>();

  public _onChange: (category: Category) => void;
  public _onTouched: () => void;
  private isDisabled: boolean = false;

  constructor(
    private store$: Store<Category[]>
  ) {
  }
  public ngOnInit(): void {
      this.store$.pipe(select(categoriesSpendindSelector)).subscribe(categories => {
      this.dataSource.data = categories;
      this.categories = categories;
      this.selectedCategory = categories[1];
    });
  }

  public writeValue(category: Category): void {
    this.selectedCategory = category || Category.default;
  }

  public registerOnChange(fn: (category: Category) => void): void {
    this._onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this._onTouched = fn;
   }

  public setDisabledState?(isDisabled: boolean): void { 
    this.isDisabled = isDisabled;
  }

  public selectCategory(event: MouseEvent, category: Category): void {
    event.preventDefault();
    event.stopPropagation();

    this.selectedCategory = category;
    this._onChange(category);
    this.menuTrigger.closeMenu();
  }
}
