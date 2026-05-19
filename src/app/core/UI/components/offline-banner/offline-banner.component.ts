import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NetworkStatusService } from '../../../network/network-status.service';

/**
 * Slim banner shown app-wide when the browser reports offline. Sits above
 * the router outlet so every page picks it up without per-page wiring
 * (live-prices doc §3 — "Offline — prices will refresh when you reconnect").
 *
 * <p>Self-hides when {@link NetworkStatusService} flips back to `online`.
 * The future CC-6 work will add an HTTP-error-driven `backendDown` signal;
 * when that lands, this banner ORs the two signals so a working browser
 * connection with a down API also raises it.
 *
 * <p>No close button — banner is informational, not actionable. User taps
 * Retry inside the page-level placeholder (PR3) if they want a manual
 * refresh.
 */
@Component({
  selector: 'pgz-offline-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './offline-banner.component.html',
  styleUrl: './offline-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineBannerComponent {
  private readonly network = inject(NetworkStatusService);

  public readonly visible = () => !this.network.online();
}
