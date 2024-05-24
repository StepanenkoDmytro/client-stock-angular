import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Category } from '../../../../../domain/category.domain';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CategorySelectComponent } from '../../../../../core/UI/components/category-select/category-select.component';

@Component({
  selector: 'pgz-add-category',
  standalone: true,
  imports: [CategorySelectComponent, FormsModule],
  templateUrl: './add-category.component.html',
  styleUrl: './add-category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCategoryComponent implements OnInit {
  public categories: Category = Category.defaultList[1];
  public selectedCategory: Category = null /* this.data?.category */ || Category.default;
  
  constructor(
    public dialogRef: MatDialogRef<AddCategoryComponent>,
  ) { }

  public ngOnInit(): void {
    // this.categoryCtrl = new FormControl(this.categories);
  }

  public onAdd(): void {
    this.dialogRef.close('add');
  }

  public onCancel(): void {
    this.dialogRef.close('cancel');
  }
}
