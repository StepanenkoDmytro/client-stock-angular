import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Category } from '../../../../../domain/category.domain';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CategorySelectComponent } from '../../../../../core/UI/components/category-select/category-select.component';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { Router, RouterModule } from '@angular/router';
import { SpendingsService } from '../../../../../service/spendings.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { IconPickerComponent } from '../../../../../core/UI/components/icon-picker/icon-picker.component';
import { EditStateService } from '../../../service/edit-state.service';


const UI_MODULES = [
  CategorySelectComponent,
  IconComponent,
  IconPickerComponent
];

const MATERIAL_MODULES = [
  FormsModule,
  ReactiveFormsModule,
  MatFormFieldModule,
  MatSelectModule,
  MatFormFieldModule,
  MatButtonModule,
  MatInputModule,
  FormsModule,
];

@Component({
  selector: 'pgz-add-category',
  standalone: true,
  imports: [...UI_MODULES, ...MATERIAL_MODULES ,RouterModule],
  templateUrl: './add-category.component.html',
  styleUrl: './add-category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCategoryComponent implements OnInit {
  public categories: Category[];
  public selectedParentCategory: Category;
  public categoryTitleCtrl: FormControl<string> = new FormControl('');
  public selectedIcon: string = 'payment';

  public editCategory: Category;

  constructor(
    private spendingService: SpendingsService,
    private editStateCategory: EditStateService,
    private router: Router,
  ) {}

  public ngOnInit(): void {
    this.editCategory = this.editStateCategory.editStateCategory;

    this.spendingService.getAllCategories().subscribe(categories => {
      this.categories = categories;
      this.selectedParentCategory = categories[1];
    });

    if(!!this.editCategory) {
      this.selectedParentCategory = Category.findCategoryById(this.editCategory.parent, this.categories);
      this.categoryTitleCtrl.setValue(this.editCategory.title);
      this.selectedIcon = this.editCategory.icon
    }
  }

  public onAdd(): void {
    const parentId = this.selectedParentCategory.id;
    
    if(!!this.editCategory) {
      const editedCategory = new Category(this.categoryTitleCtrl.value, this.selectedIcon, this.editCategory.children, false, this.editCategory.id, parentId);
      
      this.spendingService.editCategory(editedCategory);
    } else {
      const newCategory = new Category(this.categoryTitleCtrl.value, this.selectedIcon);
      newCategory.setParent(parentId);

      this.spendingService.addCategory(newCategory);
    }
    this.router.navigate(['spending']);
  }

  public onSelectIcon(icon: string): void {
    this.selectedIcon = icon;
  }
}
