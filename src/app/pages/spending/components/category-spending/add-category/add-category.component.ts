import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Category } from '../../../../../domain/category.domain';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SpendingsService } from '../../../../../service/spendings.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { IconPickerComponent } from '../../../../../core/UI/components/icon-picker/icon-picker.component';
import { EditStateService } from '../../../service/edit-state.service';
import { combineLatest, firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormFieldComponent } from '../../../../../core/UI/components/form-field/form-field.component';
import { AcceptBtnComponent } from '../../../../../core/UI/components/accept-btn/accept-btn.component';
import { ArrowBackComponent } from '../../../../../core/UI/components/arrow-back/arrow-back.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Spending } from '../../../model/Spending';
import { DeleteCategoryDialogComponent } from '../delete-category-dialog/delete-category-dialog.component';


const UI_MODULES = [
  IconComponent,
  IconPickerComponent,
  FormFieldComponent,
  AcceptBtnComponent,
  ArrowBackComponent
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
  CommonModule
];

@Component({
  selector: 'pgz-add-category',
  standalone: true,
  imports: [...UI_MODULES, ...MATERIAL_MODULES ,RouterModule],
  templateUrl: './add-category.component.html',
  styleUrl: './add-category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCategoryComponent implements OnInit, OnDestroy {
  public categories: Category[];
  public selectedParentCategory: Category;
  public categoryTitleCtrl: FormControl<string> = new FormControl('');
  public selectedIcon: string = 'payment';
  public selectedColor: string = '#000000';
  public limitOfCaregory: number = 0;

  public editCategory: Category;

  constructor(
    private spendingService: SpendingsService,
    private editStateCategory: EditStateService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
  ) {}

  public ngOnInit(): void {
    this.spendingService.init();
    combineLatest([
      this.route.paramMap,
      this.spendingService.getAllCategories()
    ]).subscribe(async ([paramMap, categories]) => {

      this.categories = categories;
      const parentCategoryId = paramMap.get('id');
      if(this.editStateCategory.editStateCategory) {
        this.editCategory = this.editStateCategory.editStateCategory;
        this.fillFields();
      } 

      this.selectedParentCategory = Category.findCategoryById(parentCategoryId, categories);
    }) ;
    
    
  }

  public onAdd(): void {
    const parentId = this.selectedParentCategory.id;
    
    if(!!this.editCategory) {
      debugger;
      const editedCategory = new Category(this.categoryTitleCtrl.value, this.selectedIcon, this.editCategory.children, false, this.editCategory.id, parentId, this.selectedColor, this.limitOfCaregory);
      
      this.spendingService.editCategory(editedCategory);
    } else {
      const newCategory = new Category(this.categoryTitleCtrl.value, this.selectedIcon);
      newCategory.setParent(parentId);
      newCategory.setColor(this.selectedColor);
      newCategory.setLimit(this.limitOfCaregory);

      this.spendingService.addCategory(newCategory);
    }
    this.router.navigate(['spending']);
  }

  public onSelectIcon(icon: string): void {
    this.selectedIcon = icon;
  }

  public openIconPicker(): void {
    const iconPicker = document.getElementById('iconPicker') as HTMLInputElement;
    if (iconPicker) {
      iconPicker.click(); 
    }
  }

  public openColorPicker(): void {
    const colorInput = document.getElementById('colorInput') as HTMLInputElement;
    if (colorInput) {
      colorInput.click(); 
    }
  }
  
  get canSave(): boolean {
    if(this.selectedParentCategory !== null && this.categoryTitleCtrl.value.length > 0) {
      return true;
    }
    return false;
  }

  public onDeleteCategory(): void {
    this.showDeleteCategoryDialod(this.editCategory);
  }

  private showDeleteCategoryDialod(category: Category): void {
    const dialogRef: MatDialogRef<DeleteCategoryDialogComponent> = this.dialog.open(DeleteCategoryDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async result => {
      const allSpendings: Spending[] = await firstValueFrom(this.spendingService.getAllSpendings());
      const spendingsToUpdate: Spending[] = this.spendingService.findSpendingsByCategoryIncludeChildren(allSpendings, category);
      
      if(result === 'save') {
        const otherCategory = this.categories.find(category => category.title === 'Other');
        this.spendingService.replaceCategoryInSpendings(otherCategory, spendingsToUpdate);
      } else if (result === 'delete') {
        spendingsToUpdate.forEach(spending => this.spendingService.deleteSpending(spending));
      }
      this.spendingService.deleteCategory(category);
    });
  }

  public ngOnDestroy(): void {
    this.editStateCategory.destroyEditState();
  }

  private fillFields(): void {
    if(!!this.editCategory) {
      this.selectedParentCategory = Category.findCategoryById(this.editCategory.parent, this.categories);
      this.categoryTitleCtrl.setValue(this.editCategory.title);
      this.selectedIcon = this.editCategory.icon;
      this.selectedColor = this.editCategory.color;
      this.limitOfCaregory = this.editCategory.limit;
    }
  }
}
