import { Injectable, inject } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { IHoldingView } from '../../../domain/holding.domain';
import {
  DeleteHoldingConfirmComponent,
  DeleteHoldingConfirmData,
  DeleteHoldingConfirmResult,
} from '../components/holdings/delete-holding-confirm/delete-holding-confirm.component';
import { HoldingService } from './holding.service';

/**
 * Thin façade that keeps Holding-level CRUD UX in one place — Edit
 * navigation, Delete confirmation flow, eventual share/copy etc.
 *
 * Why this exists: both `pgz-position-row` (per-account row inside a
 * multi-holding Position) and `pgz-position-card` (single-holding cards)
 * surface the same overflow menu with Edit / Delete. Without a façade
 * each component would duplicate the bottom-sheet wiring + snackbar +
 * service dispatch. The Edit route also lives here so when M2 backend
 * changes the URL shape we patch one file instead of two.
 *
 * Pure user-facing actions only — no store internals. Components don't
 * import MatBottomSheet / Router / HoldingService directly when going
 * through this façade.
 */
@Injectable({ providedIn: 'root' })
export class HoldingActionsService {
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly holdings = inject(HoldingService);

  /** Navigates to the Edit Holding form, prefilled by the route param. */
  editHolding(id: string): void {
    this.router.navigate(['/savings/edit-holding', id]);
  }

  /**
   * Opens the delete confirmation bottom-sheet for one holding. On
   * "delete" — dispatches the store action and notifies via snackbar.
   * Caller passes pre-computed `currentValue` so the sheet doesn't
   * import the price service.
   */
  deleteHolding(holding: IHoldingView, currentValue: number): void {
    const data: DeleteHoldingConfirmData = {
      symbol: holding.instrument.symbol,
      accountName: holding.accountName,
      quantity: holding.quantity,
      averageBuyPrice: holding.averageBuyPrice,
      currentValue,
      currency: holding.currency,
    };

    const ref = this.bottomSheet.open<
      DeleteHoldingConfirmComponent,
      DeleteHoldingConfirmData,
      DeleteHoldingConfirmResult
    >(DeleteHoldingConfirmComponent, {
      data,
      panelClass: 'delete-holding-sheet-container',
    });

    ref.afterDismissed().subscribe((result) => {
      if (result === 'delete') {
        this.holdings.deleteHolding(holding.id);
        this.snackBar.open(
          `${holding.instrument.symbol} deleted`,
          'Dismiss',
          { duration: 3000 },
        );
      }
    });
  }
}
