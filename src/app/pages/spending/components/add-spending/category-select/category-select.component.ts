import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CategoryBottomSheetComponent } from '../../../../../core/UI/components/category-bottom-sheet/category-bottom-sheet.component';
import { Category } from '../../../../../domain/category.domain';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';

@Component({
  selector: 'pgz-category-selector',
  standalone: true,
  imports: [IconComponent, CommonModule],
  templateUrl: './category-select.component.html',
  styleUrl: './category-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySelectorComponent implements OnInit {
  @Input()
  public categories: Category[] = [];
  @Input()
  public activeCategory: Category | null = null;

  @Output()
  public selectedCategory: EventEmitter<Category | null> = new EventEmitter(null);

  public ancestors: Category[] = [];

  constructor(
    private bottomSheet: MatBottomSheet,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    if(this.activeCategory) {
      this.ancestors = this.getAncestors(this.activeCategory, this.categories);
    }
  }

  public getAncestors(category: Category | null, categories: Category[]): Category[] {
    if (!category) {
      return [];
    }
  
    const ancestors: Category[] = [];
    let currentCategory = category;
  
    while (currentCategory.parent) {
      const parentCategory = Category.findCategoryById(currentCategory.parent, categories);
      if (parentCategory) {
        ancestors.unshift(parentCategory); 
        currentCategory = parentCategory;
      } else {
        break; 
      }
    }
  
    return ancestors;
  }

  public openBottomSheet(): void {
    const ref = this.bottomSheet.open(CategoryBottomSheetComponent, {
      data: {
        categories: this.categories,
        activeCategory: this.activeCategory
      },
      panelClass: 'category-bottom-sheet'
    });

    ref.afterDismissed().subscribe((selectedCategory: Category | null) => {
      if (selectedCategory) {
        this.activeCategory = selectedCategory;
        this.selectedCategory.emit(selectedCategory);
        this.ancestors = this.getAncestors(this.activeCategory, this.categories);
        this.cdr.detectChanges();
      }
    });
  }
}
