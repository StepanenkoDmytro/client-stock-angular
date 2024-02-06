import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { SpendingsService } from '../../../service/spendings.service';
import { Spending } from '../model/Spending';


@Injectable({
  providedIn: 'root'
})
export class EditStateSpendingService {
  public editStateSpending: Spending = null;
  public prevRoute: Route = null;

  constructor(
    private spendingService: SpendingsService
  ) { }

  public saveEditStateSpending(spending: Spending, route?: Route): void {
    this.editStateSpending = spending;
    this.prevRoute = route;
  }

  public deleteCurrentSpending(spending: Spending): void {
    
    this.spendingService.deleteSpending(spending);
  }

  public destroyEditStateSpending(): void {
    this.editStateSpending = null;
    this.prevRoute = null;
  }
}
