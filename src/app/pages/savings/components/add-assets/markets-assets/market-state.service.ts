import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarketStateService {
  public asset: BehaviorSubject<any> = new BehaviorSubject({});

  public choiseAsset(asset: any): void {
    this.asset.next(asset);
  }
}
