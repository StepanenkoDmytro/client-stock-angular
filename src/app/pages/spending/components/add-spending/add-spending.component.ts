import { ChangeDetectionStrategy, Component } from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';


const UI_MODULES = [
  MatSelectModule,
  MatFormFieldModule,
  MatIconModule
];

const MATERIAL_MODULES = [
  MatButtonModule
]

@Component({
  selector: 'pgz-add-spending',
  standalone: true,
  imports: [...UI_MODULES, ...MATERIAL_MODULES],
  templateUrl: './add-spending.component.html',
  styleUrl: './add-spending.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSpendingComponent {

  public categories: any[] = [
    {
      title: 'Car',
      icon: 'assets/expend/car.svg'
    },
    {
      title: 'Clothes',
      icon: 'assets/expend/clothes.svg'
    }
  ];
  public selectedCategory: any = this.categories[0];

  test(event: any) {
    console.log('test',event);
    
  }
}
