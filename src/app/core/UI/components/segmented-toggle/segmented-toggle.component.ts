import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

/**
 * Two-option segmented toggle, 32px tall compact pill.
 *
 * Reference: design/savings/00-mobile-shell-baseline.svg lines 30-35
 * — Material-tabs-style segmented control with an inner dark pill
 * sliding between two options. Used for /savings Classes ↔ Holdings.
 *
 * Differs from pgz-button-toggle (which is a wider sliding switch with
 * label-on-both-sides). This one fits the modern compact-tab pattern
 * (Binance, Robinhood, Coinbase mobile).
 *
 * API: takes two string options, emits the active one as string.
 * Default value = `options[0]`.
 */
@Component({
  selector: 'pgz-segmented-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './segmented-toggle.component.html',
  styleUrl: './segmented-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedToggleComponent {
  @Input({ required: true }) public options!: [string, string];
  @Input() public value: string = '';
  @Output() public valueChange = new EventEmitter<string>();

  public select(option: string): void {
    if (option === this.value) {
      return;
    }
    this.value = option;
    this.valueChange.emit(option);
  }

  public isActive(option: string): boolean {
    return option === this.value;
  }
}
