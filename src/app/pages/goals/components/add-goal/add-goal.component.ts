import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';


const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  FormsModule,
  MatSelectModule
];

@Component({
  selector: 'pgz-add-goal',
  standalone: true,
  imports: [...MATERIAL_MODULES, RouterModule],
  templateUrl: './add-goal.component.html',
  styleUrl: './add-goal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddGoalComponent {
  public nameOfGoal: string;
  public costOfGoal: number;

  public statuses: any[] = [
    {
      name: 'Share of portfolio',
      value: 'progress',
    },
    {
      name: 'Fixed sum',
      value: 'success',
    },
    {
      name: 'Not included in the portfolio',
      value: 'disabled',
    },
  ]; 
}
