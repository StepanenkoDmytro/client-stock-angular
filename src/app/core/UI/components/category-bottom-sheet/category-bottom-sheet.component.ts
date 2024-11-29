import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { Category } from '../../../../domain/category.domain';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'pgz-category-bottom-sheet',
  standalone: true,
  imports: [MatIconModule, CommonModule, IconComponent],
  templateUrl: './category-bottom-sheet.component.html',
  styleUrl: './category-bottom-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryBottomSheetComponent {
  currentCategories: Category[] = [];
  currentTitle: string = 'Категорії';
  history: { title: string; categories: Category[] }[] = [];

  activeCategory: Category | null = null;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<CategoryBottomSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { categories: Category[]; activeCategory?: Category }
  ) {
    this.currentCategories = data.categories;

    if (data.activeCategory) {

      //TODO: прописати зміну currentCategories при activeCategory 
      this.activeCategory = data.activeCategory;
      // this.navigateToActiveCategory(data.activeCategory);
    }
    console.log(data);
  }

  selectCategory(category: Category): void {
    console.log('here');
    // debugger;
    if (category.children && category.children.length > 0) {
      this.history.push({ title: this.currentTitle, categories: this.currentCategories });
      this.currentCategories = category.children;
      this.currentTitle = category.title;
    }
  }

  goBack(): void {
    const previousState = this.history.pop();
    if (previousState) {
      this.currentCategories = previousState.categories;
      this.currentTitle = previousState.title;
      this.activeCategory = null;
    }
  }
}
