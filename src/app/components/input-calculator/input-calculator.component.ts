import { Component } from '@angular/core';

@Component({
  selector: 'app-input-calculator',
  templateUrl: './input-calculator.component.html',
  styleUrls: ['./input-calculator.component.scss']
})
export class InputCalculatorComponent {
  public numbers: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '='];
  public actions: string[] = ['+', '-', '*', '/'];
}
