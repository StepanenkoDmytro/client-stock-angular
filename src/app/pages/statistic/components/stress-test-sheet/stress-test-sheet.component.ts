import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

/**
 * Stress test bottom sheet (mockup §12). Hardcoded demo scenario:
 * Crypto −50% → −$13,050, Stocks −30% → −$11,040, Real estate −20%
 * → −$22,000. Total impact −$46,090 (−22.5% of $204,895 portfolio).
 *
 * Triggered from the Volatility profile card on /statistic Risk
 * section («Stress test →» link). No interactivity — single static
 * scenario per the mockup. When real data lands the rows become
 * computed from holdings × shock-percentages-by-class.
 */
@Component({
  selector: 'pgz-stress-test-sheet',
  standalone: true,
  templateUrl: './stress-test-sheet.component.html',
  styleUrl: './stress-test-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StressTestSheetComponent {
  constructor(private readonly ref: MatBottomSheetRef<StressTestSheetComponent>) {}

  public close(): void {
    this.ref.dismiss();
  }
}
