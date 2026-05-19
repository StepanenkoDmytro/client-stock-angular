import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserPreferences } from '../../../domain/user-preferences.domain';
import { AuthService } from '../../../service/auth.service';

/**
 * Frontend client for `GET / PUT /api/v1/me/preferences` (M3 backend).
 * Caches the latest preferences as a signal so the navigation chrome
 * (header, settings dialog, etc.) can read base-currency reactively.
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  /** Latest fetched preferences; `null` before first {@link load}. */
  private readonly _current = signal<UserPreferences | null>(null);
  public readonly current = this._current.asReadonly();

  /** Convenience: baseCurrency or `null` if not yet loaded. */
  public readonly baseCurrency = computed<string | null>(
    () => this._current()?.baseCurrency ?? null,
  );

  /**
   * Idempotent fetch — issue once per session typically (from a top-level
   * component). Returns an observable for first-load awaiters; the
   * cached signal also updates.
   *
   * Anonymous (no auth token): short-circuit to `null`. Hitting
   * `/me/preferences` without auth would 401, the interceptor would
   * silently try `/refresh-token`, fail, then logout-redirect — exactly
   * the bug ADR-0012 calls out for anonymous mode. Caller's UI falls
   * back to a locally-stored default baseCurrency (e.g. 'USD').
   */
  public load(): Observable<UserPreferences | null> {
    if (!this.auth.authToken) {
      return of(null);
    }
    return this.http
      .get<UserPreferences>(`${environment.apiBaseUrl}/me/preferences`)
      .pipe(
        tap((prefs) => this._current.set(prefs)),
        catchError((err: HttpErrorResponse) => {
          if (typeof console !== 'undefined') {
            console.debug('UserPreferencesService.load failed', err.status);
          }
          return of(null);
        }),
      );
  }

  /**
   * Update baseCurrency and persist. Backend whitelist validates — 400
   * propagates as an error so the caller can show a Material snackbar.
   * On success, the cached signal updates with the server-canonicalised
   * value (uppercased).
   */
  public setBaseCurrency(currency: string): Observable<UserPreferences | null> {
    return this.http
      .put<UserPreferences>(`${environment.apiBaseUrl}/me/preferences`, {
        baseCurrency: currency,
      })
      .pipe(
        tap((prefs) => this._current.set(prefs)),
        catchError((err: HttpErrorResponse) => {
          if (typeof console !== 'undefined') {
            console.debug('UserPreferencesService.setBaseCurrency failed', err.status);
          }
          return of(null);
        }),
      );
  }
}
