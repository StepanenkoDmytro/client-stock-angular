import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { SpendingsService } from '../../../service/spendings.service';
import { Spending } from '../model/Spending';
import { Category } from '../../../domain/category.domain';


@Injectable({
  providedIn: 'root'
})
export class EditStateService {
  public editStateSpending: Spending = null;
  public editStateCategory: Category = null;
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

  public saveEditStateCategory(category: Category): void {
    this.editStateCategory = category;
  }

  public destroyEditState(): void {
    this.editStateSpending = null;
    this.editStateCategory = null;
    this.prevRoute = null;
  }
}
