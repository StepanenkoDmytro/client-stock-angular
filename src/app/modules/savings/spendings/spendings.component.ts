import { Component } from '@angular/core';
import { STOCKS_MOCK } from '../mock.domain';

@Component({
  selector: 'app-spendings',
  templateUrl: './spendings.component.html',
  styleUrls: ['./spendings.component.scss']
})
export class SpendingsComponent {
  stocksMock = STOCKS_MOCK;
}
