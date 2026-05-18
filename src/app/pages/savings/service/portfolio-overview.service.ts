import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PortfolioOverview } from '../../../domain/portfolio-overview.domain';

/**
 * Frontend client for `GET /api/v1/portfolio/overview` (M3 backend MVP).
 * Caches the latest fetched overview as a signal so multiple components
 * can read the same value without re-issuing HTTP.
 *
 * <p>Intentionally minimal: no polling, no auto-invalidation. Caller
 * triggers {@link #refresh()} on screens that need fresh data (e.g.
 * `SavingsComponent.ngOnInit`). The endpoint itself is cheap (cached on
 * the backend through `FxRateService` Caffeine + per-class
 * `PriceFeed` cache), but issuing N parallel GETs from multiple
 * subscribed components is still wasteful.
 *
 * <p>Errors (network, 5xx) leave the signal at its previous value and
 * log to console. 401/403 propagates so callers can redirect to login.
 */
@Injectable({ providedIn: 'root' })
export class PortfolioOverviewService {
  private readonly http = inject(HttpClient);

  /** Last fetched overview; `null` until first successful {@link refresh}. */
  private readonly _latest = signal<PortfolioOverview | null>(null);
  public readonly latest = this._latest.asReadonly();

  /** Convenience: total in baseCurrency, or `null` when never fetched. */
  public readonly total = computed<number | null>(() => this._latest()?.total ?? null);

  /** Convenience: the baseCurrency from the most recent fetch. */
  public readonly baseCurrency = computed<string | null>(
    () => this._latest()?.baseCurrency ?? null,
  );

  /** Loading flag for UI spinners. */
  private readonly _loading = signal<boolean>(false);
  public readonly loading = this._loading.asReadonly();

  /**
   * Trigger a fresh fetch. Returns the same observable so callers may
   * await completion (e.g. for first-load gating); the cached signal
   * also updates on success.
   */
  public refresh(): Observable<PortfolioOverview | null> {
    this._loading.set(true);
    return this.http
      .get<PortfolioOverview>(`${environment.apiBaseUrl}/portfolio/overview`)
      .pipe(
        tap((overview) => {
          this._latest.set(overview);
          this._loading.set(false);
        }),
        catchError((err: HttpErrorResponse) => {
          this._loading.set(false);
          // 401/403 surfaces to the caller — login expired. Other errors
          // keep the previous cached value rather than blanking the UI.
          if (typeof console !== 'undefined') {
            console.debug('PortfolioOverviewService.refresh failed', err.status);
          }
          return of(null);
        }),
      );
  }
}
