import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Category } from '../../../../../domain/category.domain';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CategorySelectComponent } from '../../../../../core/UI/components/category-select/category-select.component';
import { IconComponent } from '../../../../../core/UI/components/icon/icon.component';
import { Router, RouterModule } from '@angular/router';
import { SpendingsService } from '../../../../../service/spendings.service';

@Component({
  selector: 'pgz-add-category',
  standalone: true,
  imports: [CategorySelectComponent, IconComponent,RouterModule , FormsModule,ReactiveFormsModule],
  templateUrl: './add-category.component.html',
  styleUrl: './add-category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCategoryComponent implements OnInit {
  public selectedCategory: Category;
  public categoryTitleCtrl: FormControl<string> = new FormControl('');

  constructor(
    private spendingService: SpendingsService,
    private router: Router,
  ) {}

  public ngOnInit(): void {
    this.spendingService.getAllCategories().subscribe(categories => {
      this.selectedCategory = categories[1];
    });
  }

  public onAdd(): void {
    const newCategory = new Category(this.categoryTitleCtrl.value);
    
    const parentId = this.selectedCategory.id;
    console.log(newCategory, parentId, this.selectedCategory);
    this.spendingService.addCategory(newCategory, parentId);
    this.router.navigate(['spending']);
  }
}
