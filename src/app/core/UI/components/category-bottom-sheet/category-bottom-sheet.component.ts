import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { Category } from '../../../../domain/category.domain';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { RouterModule } from '@angular/router';
import { AddBtnComponent } from '../add-btn/add-btn.component';
import { CategorySpendingCardComponent } from '../../../../pages/spending/components/category-spending/category-spending-card/category-spending-card.component';
import { PrevRouteComponent } from '../prev-route/prev-route.component';

@Component({
  selector: 'pgz-category-bottom-sheet',
  standalone: true,
  imports: [MatIconModule, CommonModule, IconComponent, RouterModule, AddBtnComponent, PrevRouteComponent],
  templateUrl: './category-bottom-sheet.component.html',
  styleUrl: './category-bottom-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryBottomSheetComponent {
  public currentCategories: Category[] = [];
  public currentTitle: string = 'Категорії';
  public history: { title: string; categories: Category[] }[] = [];

  public activeCategory: Category | null = null;

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
    } else {
      // Якщо категорія не має дочірніх категорій, вибираємо її як активну
      this.activeCategory = category;
      this.closeBottomSheet();
    }
  }

  closeBottomSheet(): void {
    this.bottomSheetRef.dismiss(this.activeCategory);
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
