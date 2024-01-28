import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MARKETS } from '../../savings.routes';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';


@Component({
  selector: 'pgz-select-market-sheet',
  standalone: true,
  imports: [],
  templateUrl: './select-market-sheet.component.html',
  styleUrl: './select-market-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectMarketSheetComponent {
  public marketsList: string[] = MARKETS;

  constructor(private _bottomSheetRef: MatBottomSheetRef<SelectMarketSheetComponent>) {}

  selectAndClose(market: string): void {
    this._bottomSheetRef.dismiss(market);
  }
}
