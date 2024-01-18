import { Injectable } from '@angular/core';
import { ISpending } from '../../../domain/spending.domain';
import { Route } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class EditStateSpendingService {
  public editStateSpending: ISpending = null;
  public prevRoute: Route = null;

  public saveEditStateSpending(spending: ISpending, route?: Route): void {
    this.editStateSpending = spending;
    this.prevRoute = route;
  }

  public destroyEditStateSpending(): void {
    this.editStateSpending = null;
    this.prevRoute = null;
  }
}
