import { Injectable } from '@angular/core';
import { ISpending } from '../../../domain/spending.domain';
import { Route } from '@angular/router';
import { SpendingsService } from '../../../service/spendings.service';


@Injectable({
  providedIn: 'root'
})
export class EditStateSpendingService {
  public editStateSpending: ISpending = null;
  public prevRoute: Route = null;

  constructor(
    private spendingService: SpendingsService
  ) { }

  public saveEditStateSpending(spending: ISpending, route?: Route): void {
    this.editStateSpending = spending;
    this.prevRoute = route;
  }

  public deleteCurrentSpending(spending: ISpending): void {
    
    this.spendingService.deleteSpending(spending);
  }

  public destroyEditStateSpending(): void {
    this.editStateSpending = null;
    this.prevRoute = null;
  }
}
