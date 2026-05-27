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

  /**
   * baseCurrency resolution: server value (when authenticated and loaded)
   * takes precedence; otherwise we fall back to the locally-persisted
   * preference so anonymous users can change their display currency too
   * (ADR-0012 anonymous mode). `null` only when neither source has it.
   */
  public readonly baseCurrency = computed<string | null>(
    () => this._current()?.baseCurrency ?? this._localBaseCurrency() ?? null,
  );

  /**
   * Local-only savings preferences bag. Frontend-only until the backend
   * `UserPreferencesDto` gets the matching columns (mirrors the
   * `IAccountV2.jurisdiction` pattern). Persists through `localStorage`
   * for anonymous and authenticated users alike — anonymous-mode
   * promotion (ADR-0012 signup-merge) reads the same key.
   */
  private static readonly LOCAL_PREFS_KEY = 'savings-prefs';

  private readonly _discoveryRowHidden = signal<boolean>(
    UserPreferencesService.readLocalPrefs().discoveryRowHidden === true,
  );

  /**
   * Locally-stored baseCurrency for anonymous mode (and a hot-cache for
   * authenticated users, so reloads don't flash the default before the
   * `/me/preferences` round-trip lands).
   */
  private readonly _localBaseCurrency = signal<string | null>(
    UserPreferencesService.readLocalPrefs().baseCurrency ?? null,
  );

  /**
   * `true` once the user dismissed the T2 Discovery row via the ✕ Hide
   * button. Forever-dismiss per task §5.3 / design-roadmap §18 —
   * persists across reloads, never auto-resurfaces.
   */
  public readonly discoveryRowHidden = this._discoveryRowHidden.asReadonly();

  public setDiscoveryRowHidden(hidden: boolean): void {
    this._discoveryRowHidden.set(hidden);
    UserPreferencesService.writeLocalPrefs({ discoveryRowHidden: hidden });
  }

  private static readLocalPrefs(): { discoveryRowHidden?: boolean; baseCurrency?: string } {
    try {
      const raw = localStorage.getItem(UserPreferencesService.LOCAL_PREFS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private static writeLocalPrefs(patch: { discoveryRowHidden?: boolean; baseCurrency?: string }): void {
    try {
      // Read-merge-write: never blow away keys we don't know about.
      const current = UserPreferencesService.readLocalPrefs();
      const next = { ...current, ...patch };
      localStorage.setItem(
        UserPreferencesService.LOCAL_PREFS_KEY,
        JSON.stringify(next),
      );
    } catch {
      // Storage quota / private mode — non-critical; in-memory signal
      // still drives the current session.
    }
  }

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
        tap((prefs) => {
          this._current.set(prefs);
          // Mirror the server value into localStorage so subsequent
          // reloads have a hot copy before /me/preferences round-trips.
          if (prefs?.baseCurrency) {
            const code = prefs.baseCurrency.toUpperCase();
            this._localBaseCurrency.set(code);
            UserPreferencesService.writeLocalPrefs({ baseCurrency: code });
          }
        }),
        catchError((err: HttpErrorResponse) => {
          if (typeof console !== 'undefined') {
            console.debug('UserPreferencesService.load failed', err.status);
          }
          return of(null);
        }),
      );
  }

  /**
   * Update baseCurrency and persist. Anonymous users (no JWT) skip the
   * server round-trip and store the value in localStorage only — the
   * computed {@link baseCurrency} falls back to the local copy when
   * `_current` is null, so the UI still reacts.
   *
   * Authenticated users persist on both sides: backend whitelist
   * validates (400 propagates as a `null` emission so callers can show
   * a Material snackbar) and the local cache is updated with the
   * server-canonicalised (uppercased) code so reloads don't flash the
   * default before `/me/preferences` lands.
   */
  public setBaseCurrency(currency: string): Observable<UserPreferences | null> {
    const normalised = currency.trim().toUpperCase();
    if (!this.auth.authToken) {
      // Anonymous mode: localStorage is the source of truth.
      this._localBaseCurrency.set(normalised);
      UserPreferencesService.writeLocalPrefs({ baseCurrency: normalised });
      return of({ baseCurrency: normalised });
    }
    return this.http
      .put<UserPreferences>(`${environment.apiBaseUrl}/me/preferences`, {
        baseCurrency: normalised,
      })
      .pipe(
        tap((prefs) => {
          this._current.set(prefs);
          if (prefs?.baseCurrency) {
            const code = prefs.baseCurrency.toUpperCase();
            this._localBaseCurrency.set(code);
            UserPreferencesService.writeLocalPrefs({ baseCurrency: code });
          }
        }),
        catchError((err: HttpErrorResponse) => {
          if (typeof console !== 'undefined') {
            console.debug('UserPreferencesService.setBaseCurrency failed', err.status);
          }
          return of(null);
        }),
      );
  }
}
