import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Category } from '../../../../../domain/category.domain';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CategorySelectComponent } from '../../../../../core/UI/components/category-select/category-select.component';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SpendingsService } from '../../../../../service/spendings.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { IconPickerComponent } from '../../../../../core/UI/components/icon-picker/icon-picker.component';
import { EditStateService } from '../../../service/edit-state.service';
import { combineLatest } from 'rxjs';


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
  public selectedColor: string = '#000000';

  public editCategory: Category;

  constructor(
    private spendingService: SpendingsService,
    private editStateCategory: EditStateService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  public ngOnInit(): void {
    this.editCategory = this.editStateCategory.editStateCategory;

    combineLatest([
      this.route.paramMap,
      this.spendingService.getAllCategories()
    ]).subscribe(async ([paramMap, categories]) => {
      this.categories = categories;
      const categoryId = paramMap.get('id');
      if(categoryId) {
        this.selectedParentCategory = await this.spendingService.findCategoryById(categoryId);
      }
    }) 

    if(!!this.editCategory) {
      this.selectedParentCategory = Category.findCategoryById(this.editCategory.parent, this.categories);
      this.categoryTitleCtrl.setValue(this.editCategory.title);
      this.selectedIcon = this.editCategory.icon;
      this.selectedColor = this.editCategory.color;
    }
  }

  public onAdd(): void {
    const parentId = this.selectedParentCategory.id;
    
    if(!!this.editCategory) {
      const editedCategory = new Category(this.categoryTitleCtrl.value, this.selectedIcon, this.editCategory.children, false, this.editCategory.id, parentId, this.selectedColor);
      
      this.spendingService.editCategory(editedCategory);
    } else {
      const newCategory = new Category(this.categoryTitleCtrl.value, this.selectedIcon);
      newCategory.setParent(parentId);
      newCategory.setColor(this.selectedColor);

      this.spendingService.addCategory(newCategory);
    }
    this.router.navigate(['spending']);
  }

  public onSelectIcon(icon: string): void {
    this.selectedIcon = icon;
  }
}
