import { Injectable } from '@angular/core';
import { Route } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class StatisticStateService {
  public prevRoute: Route = null;

  constructor() { }
}
