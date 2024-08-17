import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Category } from '../../../domain/category.domain';

export interface BreadCrumb {
  label: string,
  path: string
}

@Injectable({
  providedIn: 'root'
})
export class StatisticStateService {
  public breadCrumbs: BehaviorSubject<Category[]> = new BehaviorSubject([]);

  constructor() { }

  public addBreadCrumb(category: Category): void {
    const currentBreadCrumbs = this.breadCrumbs.getValue();
    const updatedBreadCrumbs = [...currentBreadCrumbs, category];
  
    this.breadCrumbs.next(updatedBreadCrumbs);
  }

  public updateBreadCrumbs(lastCrumbId: string): void {
    const currentBreadCrumbs = this.breadCrumbs.getValue();
    const lastCrumb = currentBreadCrumbs.find(crumb => crumb.id === lastCrumbId);
    const lastCrumbIndex = currentBreadCrumbs.indexOf(lastCrumb);
    
    if(lastCrumbIndex < currentBreadCrumbs.length - 1) {
      const updatedBreadCrumbs = currentBreadCrumbs.slice(0, lastCrumbIndex + 1);
      this.breadCrumbs.next(updatedBreadCrumbs);
    }
  }
}
