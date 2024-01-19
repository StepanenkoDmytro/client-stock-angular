import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IAsset } from '../../../../../domain/savings.domain';

@Injectable({
  providedIn: 'root'
})
export class MarketStateService {
  public asset: BehaviorSubject<any> = new BehaviorSubject({});

  public choiseAsset(asset: IAsset): void {
    this.asset.next(asset);
  }
}
