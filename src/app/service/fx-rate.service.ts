import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Server response from `GET /api/v1/fx-rates?base=X&currencies=...&at=YYYY-MM-DD`.
 * Mirrors `FxRatesResponseDto` on the backend.
 */
interface FxRatesResponse {
  base: string;
  at: string;
  rates: Record<string, number>;
  unresolved: string[];
  stale: boolean;
}

/** Cache key: `<base>:<targetOrEmpty>:<dateIsoOrToday>`. */
type CacheKey = string;

/**
 * Client-side FX rate cache (ADR-0002 frontend pillar).
 *
 * Pattern: feature pages call {@link preload} once per `(base, currencies, date)`
 * tuple. That populates the in-memory cache via the batch endpoint. After that
 * {@link convertSync} answers without I/O — required because Spending aggregates
 * loop over hundreds of rows inside NgRx selectors or template bindings, which
 * can't be Observable.
 *
 * Today-rates live for the session (next reload re-fetches). Historical rates
 * persist to {@code localStorage} forever — immutable per ADR-0002 §Caching.
 */
@Injectable({ providedIn: 'root' })
export class FxRateService {
  private static readonly LS_KEY = 'fx-rate-cache:historical';

  private readonly http = inject(HttpClient);

  /** All cached rates by composite key. */
  private readonly _cache = signal<Map<CacheKey, number>>(this.loadHistorical());
  /** Currencies the backend couldn't resolve in the last preload (UI shows banner). */
  private readonly _unresolved = signal<ReadonlySet<string>>(new Set());
  /** `true` if any rate from the latest preload was stale. */
  private readonly _stale = signal<boolean>(false);

  public readonly unresolved = this._unresolved.asReadonly();
  public readonly stale = this._stale.asReadonly();
  public readonly hasUnresolved = computed(() => this._unresolved().size > 0);

  /**
   * Fetch a batch of rates and merge into the cache. Idempotent — if all
   * pairs are already cached for `(base, at)`, returns synchronously without
   * a request.
   *
   * No auth required: `/api/v1/fx-rates` is in `SecurityConfig` permitAll —
   * anonymous users (ADR-0012 anonymous mode) also aggregate local Spendings
   * into their baseCurrency and need real conversion, not raw-sum fallback.
   */
  public preload(base: string, currencies: string[], at?: Date): Observable<void> {
    const dateIso = at ? toIsoDate(at) : 'today';
    const normalizedBase = base.toUpperCase();
    const wanted = Array.from(new Set(currencies.map(c => c.toUpperCase())))
      .filter(c => c !== normalizedBase);

    const missing = wanted.filter(t => !this._cache().has(this.key(normalizedBase, t, dateIso)));
    if (missing.length === 0) {
      return of(undefined);
    }

    const params: Record<string, string> = {
      base: normalizedBase,
      currencies: missing.join(','),
    };
    if (at) {
      params['at'] = dateIso;
    }

    return this.http.get<FxRatesResponse>(`${environment.apiBaseUrl}/fx-rates`, { params }).pipe(
      tap(resp => this.applyResponse(resp, dateIso)),
      map(() => undefined),
      catchError(err => {
        // Network or 401 — fall back to "unresolved" so callers know not to
        // claim a conversion they don't have.
        this._unresolved.set(new Set(missing));
        if (typeof console !== 'undefined') {
          console.debug('FxRateService.preload failed', err?.status ?? err);
        }
        return of(undefined);
      }),
    );
  }

  /**
   * Synchronous conversion. Returns `null` when neither direction of the
   * pair is cached — caller decides whether to display "Mixed", "—", or
   * fall back to raw arithmetic.
   *
   * Symmetric: if {@code from→to} isn't cached but {@code to→from} is,
   * uses the inverse rate ({@code amount / inverseRate}). This matters
   * because callers typically preload {@code base → many} but then convert
   * {@code native → base} during aggregation (the opposite direction).
   */
  public convertSync(
    amount: number,
    from: string,
    to: string,
    at?: Date,
  ): number | null {
    if (amount == null || isNaN(amount)) {
      return null;
    }
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (f === t) {
      return amount;
    }
    const rate = this.getRate(f, t, at);
    if (rate == null) {
      return null;
    }
    return amount * rate;
  }

  /**
   * Display-oriented conversion for template / computed code paths.
   * Converts {@code amount} from {@code from} into {@code base}, returning
   * the raw {@code amount} unchanged when the rate isn't cached yet (a
   * {@link preload} is still in flight) so the UI never blanks. A
   * missing/empty {@code from} is treated as already in {@code base} (no
   * conversion). Because it routes through {@link convertSync} → the
   * {@code _cache} signal, Angular `computed`s that call it re-run when a
   * preload populates new rates.
   */
  public toBase(amount: number, from: string | null | undefined, base: string): number {
    const f = (from || base).toUpperCase();
    const b = base.toUpperCase();
    if (f === b) {
      return amount;
    }
    const converted = this.convertSync(amount, f, b);
    return converted ?? amount;
  }

  /**
   * Rate for {@code from → to}, looking up either direction of the pair.
   * If the cache only has {@code to → from}, returns its inverse.
   * {@code null} when neither direction is cached.
   */
  public getRate(from: string, to: string, at?: Date): number | null {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (f === t) {
      return 1;
    }
    const dateIso = at ? toIsoDate(at) : 'today';
    const direct = this._cache().get(this.key(f, t, dateIso));
    if (direct != null) {
      return direct;
    }
    const inverse = this._cache().get(this.key(t, f, dateIso));
    if (inverse != null && inverse !== 0) {
      return 1 / inverse;
    }
    return null;
  }

  // ---- internals ----

  private applyResponse(resp: FxRatesResponse, requestedDateIso: string): void {
    const next = new Map(this._cache());
    const dateIso = requestedDateIso === 'today' ? 'today' : resp.at;
    for (const [target, rate] of Object.entries(resp.rates)) {
      next.set(this.key(resp.base, target, dateIso), rate);
    }
    this._cache.set(next);
    this._unresolved.set(new Set(resp.unresolved ?? []));
    this._stale.set(resp.stale);

    // Persist historical rates only — spot ("today") is session-scoped so
    // it refreshes on the next session start.
    if (dateIso !== 'today') {
      this.persistHistorical(resp.base, resp.rates, dateIso);
    }
  }

  private key(base: string, target: string, dateIso: string): CacheKey {
    return `${base}:${target}:${dateIso}`;
  }

  private loadHistorical(): Map<CacheKey, number> {
    try {
      const raw = localStorage.getItem(FxRateService.LS_KEY);
      if (!raw) return new Map();
      const obj = JSON.parse(raw) as Record<string, number>;
      return new Map(Object.entries(obj));
    } catch {
      return new Map();
    }
  }

  private persistHistorical(base: string, rates: Record<string, number>, dateIso: string): void {
    try {
      const stored = this.loadHistorical();
      for (const [target, rate] of Object.entries(rates)) {
        stored.set(this.key(base, target, dateIso), rate);
      }
      const obj: Record<string, number> = {};
      stored.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem(FxRateService.LS_KEY, JSON.stringify(obj));
    } catch {
      // Quota / private mode — non-critical, signal cache still drives session.
    }
  }
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
