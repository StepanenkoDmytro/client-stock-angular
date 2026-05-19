import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Blocking placeholder shown on `/savings` when the user is offline AND
 * the {@link LivePriceService} quote cache is empty (no live prices and
 * nothing hydrated from localStorage). Per live-prices doc §3 Rule 1 —
 * rendering the dashboard with no price data anywhere would just be a
 * sea of placeholder dashes, which is worse than a single honest
 * "connect to load" message.
 *
 * <p>Stays small on purpose — bottom nav still works, the user can move
 * to Spending / Stats / Profile while waiting for connectivity. Retry
 * button re-checks `navigator.onLine` and fires a one-off poll via
 * `LivePriceService.refresh()`.
 */
@Component({
  selector: 'pgz-savings-offline-placeholder',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './savings-offline-placeholder.component.html',
  styleUrl: './savings-offline-placeholder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsOfflinePlaceholderComponent {
  @Output() readonly retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
