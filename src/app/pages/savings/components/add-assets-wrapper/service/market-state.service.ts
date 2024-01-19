import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IAsset } from '../../../../../domain/savings.domain';

@Injectable({
  providedIn: 'root'
})
export class MarketStateService {
  public asset: BehaviorSubject<IAsset | null> = new BehaviorSubject<IAsset>(null);

  public selectAsset(asset: IAsset): void {
    this.asset.next(asset);
  }
}
