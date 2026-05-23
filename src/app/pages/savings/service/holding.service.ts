import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { EMPTY, Observable, catchError, filter, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AccountKind } from '../../../domain/account-kind.domain';
import { IHolding } from '../../../domain/holding.domain';
import { AuthService } from '../../../service/auth.service';
import { DEMO_FALLBACK_PRICES } from '../../../core/data/demo-fixtures';
import { OfflineStorageService } from '../../../core/offline-storage/offline-storage.service';
import { DemoDataService } from '../../../core/services/demo-data.service';
import {
  addHolding,
  assignTags,
  deleteHolding,
  editHolding,
  loadHoldings,
} from '../store/holdings.actions';
import { IHoldingsState } from '../store/holdings.reducer';
import {
  selectHoldingsList,
  selectHoldingsState,
} from '../store/holdings.selectors';
import {
  HoldingApiDto,
  HoldingApiService,
  HoldingCreateRequest,
  HoldingTopUpRequest,
  HoldingUpdateRequest,
} from './holding-api.service';
import { InstrumentService } from './instrument.service';
import { LivePriceService } from './live-price.service';
import { TagsService } from './tags.service';

/**
 * HoldingService — feature-local CRUD + localStorage sync for `IHolding`.
 *
 * <p>Mirrors `TagsService` shape: NgRx is the source of truth, localStorage
 * is the offline snapshot. Production hydrates from
 * `GET /api/v1/holdings`; anonymous / demo modes stay local.
 *
 * <p>Bootstrap no longer seeds demo fixtures — that responsibility moved to
 * {@link DemoDataService} per `docs/notes/2026-05-savings-empty-states-ladder.md`
 * §6 PR1. Demo data lands in the store only when the user opts in via the
 * «Try with demo data» link (PR3) or the Profile «Restore demo» action
 * (PR5). The {@link #resetDemoData} button still works — it delegates to
 * {@link DemoDataService#restore} until PR5 ships the proper banner /
 * Profile UI.
 */
@Injectable({ providedIn: 'root' })
export class HoldingService {
  private static readonly STORAGE_KEY = 'holdings-list';
  private static readonly DELETE_QUEUE_KEY = 'holdings';

  private readonly store$ = inject(Store<{ holdings: IHoldingsState }>);
  private readonly instruments = inject(InstrumentService);
  private readonly livePrice = inject(LivePriceService);
  private readonly tags = inject(TagsService);
  private readonly api = inject(HoldingApiService);
  private readonly auth = inject(AuthService);
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly demoData = inject(DemoDataService);

  private isInit = false;

  init(): void {
    if (this.isInit) {
      return;
    }
    this.isInit = true;

    // Bootstrap dependencies — instruments cache + tags store load from
    // their own caches / backend. Pre-PR1 we needed tag ids materialised
    // before mock-seeding holdings; with auto-seed gone the ordering is
    // kept anyway so DemoDataService.seed() (called later, opt-in) finds
    // a populated tag store synchronously.
    this.instruments.init();
    this.tags.init();

    this.bootstrap();

    this.store$
      .pipe(
        select(selectHoldingsState),
        filter((state) => !!state),
      )
      .subscribe((state) => {
        localStorage.setItem(
          HoldingService.STORAGE_KEY,
          JSON.stringify(state),
        );
      });

    window.addEventListener('storage', (event) => {
      if (event.key === HoldingService.STORAGE_KEY) {
        this.bootstrap(true);
      }
    });
  }

  getAll(): Observable<IHolding[]> {
    return this.store$.pipe(select(selectHoldingsList));
  }

  /**
   * Local-only direct store insert. Demo and anonymous callers route through
   * this — {@link #addHolding} above flips between this and the REST path
   * based on auth / demo mode. Production authenticated callers always go
   * REST-first.
   */
  private addHoldingLocal(holding: IHolding): void {
    this.store$.dispatch(addHolding({ holding }));
  }

  /**
   * Legacy local-only edit. Reducer arithmetic for the optional top-up
   * formula lives here for backward compat (demo-mode "Reset" flow, any
   * unmigrated caller). Production write paths go through {@link #update}
   * and {@link #topUp}, which round-trip the change through the backend
   * and then dispatch the server-canonical row.
   */
  editHolding(
    id: string,
    patch: Partial<IHolding>,
    addQuantity = 0,
    addPrice = 0,
  ): void {
    this.store$.dispatch(
      editHolding({ id, addQuantity, addPrice, patch }),
    );
  }

  /**
   * Create a holding. Three flavours depending on caller context:
   *
   *  1. **Demo mode** (`environment.demoData=true`) — local dispatch only,
   *     no API. Screenshot / story sessions stay self-contained.
   *  2. **Anonymous** (no `authToken`, production build) — local dispatch
   *     with `isSaved: false`. The signup-merge wizard (Phase 3b PR5)
   *     scans for these and batch-uploads them after sign-in. Per ADR-0012
   *     §Anonymous-mode.
   *  3. **Authenticated** — REST-first: POST `/api/v1/holdings`, dispatch
   *     the server-shaped row (`isSaved: true`). The local UUID we sent
   *     is replaced by the server-generated id — UI flickers once,
   *     acceptable trade-off until backend accepts client UUIDs.
   */
  addHolding(holding: IHolding): Observable<IHolding> {
    if (environment.demoData || !this.auth.authToken) {
      this.addHoldingLocal({ ...holding, isSaved: false });
      return new Observable<IHolding>((sub) => { sub.next(holding); sub.complete(); });
    }
    return this.api.create(this.toCreateRequest(holding)).pipe(
      map(HoldingService.fromApiDto),
      map((saved) => ({ ...saved, isSaved: true })),
      tap((saved) => this.store$.dispatch(addHolding({ holding: saved }))),
    );
  }

  /**
   * Pure edit (no avg-price recompute). Local-first: dispatch with
   * `isSaved: false` immediately so the UI reflects the change without
   * waiting on the round-trip. If authenticated, fire the PUT in
   * background; on success dispatch the server-canonical patch with
   * `isSaved: true`. Anonymous / demo skip the API entirely.
   */
  update(id: string, body: HoldingUpdateRequest): Observable<IHolding> {
    this.dispatchLocalPatch(id, this.toLocalPatch(body), 0, 0);
    if (environment.demoData || !this.auth.authToken) {
      return this.getLocalById(id);
    }
    return this.api.update(id, body).pipe(
      map(HoldingService.fromApiDto),
      tap((saved) => this.dispatchSavedPatch(id, saved)),
    );
  }

  /**
   * Top-up: avg-buy-price weighted-average recompute. Same local-first
   * pattern as {@link #update}. The reducer's existing `addQuantity > 0`
   * branch applies the formula locally; the server's response (also
   * weighted-avg per ADR-0001) replaces our local result on success so
   * any rounding drift collapses to the canonical value.
   */
  topUp(id: string, body: HoldingTopUpRequest): Observable<IHolding> {
    this.dispatchLocalPatch(id, {}, body.addQuantity, body.addBuyPrice);
    if (environment.demoData || !this.auth.authToken) {
      return this.getLocalById(id);
    }
    return this.api.topUp(id, body).pipe(
      map(HoldingService.fromApiDto),
      tap((saved) => this.dispatchSavedPatch(id, saved)),
    );
  }

  /**
   * Delete. Local-first: drop the row from the store immediately.
   * Authenticated path fires DELETE; on transient failure (network /
   * 5xx) the id is enqueued via {@link OfflineStorageService} so the
   * next sync drains it (Phase 3b PR1 generic queue). Anonymous / demo
   * skip the API; nothing to re-sync since the record is purely local.
   */
  deleteHolding(id: string): Observable<void> {
    this.store$.dispatch(deleteHolding({ id }));
    if (environment.demoData || !this.auth.authToken) {
      return new Observable<void>((sub) => { sub.next(); sub.complete(); });
    }
    return this.api.delete(id).pipe(
      catchError((err: HttpErrorResponse) => {
        if (HoldingService.isTransient(err)) {
          this.offlineStorage.enqueueDelete(HoldingService.DELETE_QUEUE_KEY, id);
        }
        return EMPTY;
      }),
    );
  }

  private dispatchLocalPatch(
    id: string,
    patch: Partial<IHolding>,
    addQuantity: number,
    addPrice: number,
  ): void {
    this.store$.dispatch(
      editHolding({
        id,
        addQuantity,
        addPrice,
        patch: { ...patch, isSaved: false },
      }),
    );
  }

  private dispatchSavedPatch(id: string, saved: IHolding): void {
    this.store$.dispatch(
      editHolding({
        id,
        addQuantity: 0,
        addPrice: 0,
        patch: { ...HoldingService.toPatch(saved), isSaved: true },
      }),
    );
  }

  private static isTransient(error: HttpErrorResponse): boolean {
    return error.status === 0 || error.status === 429 ||
      (error.status >= 500 && error.status < 600);
  }

  assignTags(holdingId: string, tagIds: string[]): void {
    this.store$.dispatch(assignTags({ holdingId, tagIds }));
  }

  // ---- mapping helpers ----

  private toCreateRequest(h: IHolding): HoldingCreateRequest {
    // UI `accountId` is sometimes a literal string ('manual', 'acc-ibkr')
    // from the legacy seed, sometimes a numeric DB id stringified by
    // {@link #fromApiDto}. Only forward numeric ids; the backend
    // (HoldingApiService.resolveAccount) auto-creates a Manual account
    // when accountId is missing.
    const acc = h.accountId !== undefined ? Number(h.accountId) : NaN;
    return {
      instrumentId: h.instrumentId,
      quantity: h.quantity,
      averageBuyPrice: h.averageBuyPrice,
      currency: h.currency || undefined,
      openedAt: h.openedAt,
      accountId: Number.isFinite(acc) ? acc : undefined,
      // `IHoldingLockMeta` is structurally identical to `HoldingLockMetaWire`
      // (same `kind` discriminator + same field names), so a direct cast
      // is safe — JSON serialization round-trips cleanly via the Java
      // sealed interface with `@JsonTypeInfo(property = "kind")`.
      lockMeta: h.lockMeta as HoldingCreateRequest['lockMeta'],
    };
  }

  private toLocalPatch(body: HoldingUpdateRequest): Partial<IHolding> {
    const patch: Partial<IHolding> = {};
    if (body.quantity !== undefined) patch.quantity = body.quantity;
    if (body.averageBuyPrice !== undefined) patch.averageBuyPrice = body.averageBuyPrice;
    if (body.currency !== undefined) patch.currency = body.currency;
    return patch;
  }

  private static toPatch(h: IHolding): Partial<IHolding> {
    return {
      quantity: h.quantity,
      averageBuyPrice: h.averageBuyPrice,
      currency: h.currency,
      accountId: h.accountId,
      accountName: h.accountName,
      accountKind: h.accountKind,
      tagIds: h.tagIds,
      updatedAt: h.updatedAt,
    };
  }

  /** Demo-mode helper: emit the just-dispatched row from the store. */
  private getLocalById(id: string): Observable<IHolding> {
    return this.store$.pipe(
      select(selectHoldingsList),
      map((list) => list.find((h) => h.id === id)),
      filter((h): h is IHolding => h !== undefined),
    );
  }

  /**
   * Current market price for a symbol. Resolution order:
   *
   *   1. {@link LivePriceService} — live quote from backend polling.
   *   2. {@link DEMO_FALLBACK_PRICES} — **only in demo mode**
   *      (`environment.demoData=true`). Covers the dev-without-backend
   *      case so the seeded dashboard still shows realistic numbers
   *      (BTC ≈ $58k, AAPL ≈ $175) instead of cost-basis fallback.
   *      Production / anonymous-production skip this tier.
   *   3. `undefined` — caller decides (typically `?? averageBuyPrice`
   *      per live-prices doc §3 Rule 2).
   */
  getCurrentPrice(symbol: string): number | undefined {
    const live = this.livePrice.getCurrentPriceBySymbol(symbol);
    if (live !== undefined) {
      return live;
    }
    if (environment.demoData) {
      return DEMO_FALLBACK_PRICES[symbol];
    }
    return undefined;
  }

  /**
   * Public reset for the holdings-list screen «Reset demo data» button.
   * Delegates to {@link DemoDataService#restore} so the demo dataset
   * appears (or refreshes) without touching real entities. Pre-PR1 this
   * method wiped localStorage and re-ran a service-local seed; PR5 will
   * remove the legacy button entirely in favour of the persistent amber
   * banner / Profile «Restore demo» actions.
   */
  resetDemoData(): void {
    if (!environment.demoData) {
      // Guard against the legacy button being wired into a production
      // build by accident — see pre-PR1 rationale.
      return;
    }
    void this.demoData.restore();
  }

  // -- internal --

  private bootstrap(forceReload = false): void {
    const raw = localStorage.getItem(HoldingService.STORAGE_KEY);

    let usedCache = false;
    if (raw) {
      try {
        const state = JSON.parse(raw) as IHoldingsState;
        if (state.holdingsList && state.holdingsList.length > 0) {
          this.store$.dispatch(loadHoldings({ state }));
          usedCache = true;
          if (environment.demoData) {
            // Demo mode — cache hit is the full story, no backend round-trip.
            // Demo entities (isDemo:true) and any real entities the user
            // added previously both come back through this branch.
            return;
          }
          // Production — cache shown for instant UX; fall through to
          // re-hydrate from the backend below.
        }
        // Empty snapshot — fall through to empty-store path below.
      } catch {
        // Corrupted snapshot — fall through to empty store.
      }
    }
    if (forceReload) {
      // Cross-tab reload event with no snapshot present; bail quietly.
      return;
    }

    // Real beta testers (production build) — backend is the source of truth.
    // If we haven't already shown a localStorage cache above, push an empty
    // state so the UI doesn't show stale fixtures during the round-trip.
    //
    // Anonymous mode (Phase 3b): if there's no auth token we *don't* hit
    // the backend — `/holdings` would 401, the interceptor would silently
    // try `/refresh-token`, also fail, then logout-redirect. For an
    // anonymous user that's a forced redirect to /sign-in on every visit.
    // Skip the GET; the local store (already loaded from cache, or empty)
    // is the source of truth until they sign in.
    if (!environment.demoData) {
      if (!usedCache) {
        this.store$.dispatch(
          loadHoldings({ state: { holdingsList: [] } }),
        );
      }
      if (this.auth.authToken) {
        this.hydrateFromBackend();
      }
      return;
    }

    // Demo mode with no cache: leave the store empty. The user opts in
    // to demo data via the «Try with demo data» link (PR3) or the
    // Profile «Restore demo» action (PR5) — both routed through
    // {@link DemoDataService#seed}.
    if (!usedCache) {
      this.store$.dispatch(loadHoldings({ state: { holdingsList: [] } }));
    }
  }

  /**
   * Pulls the canonical holdings list from `GET /api/v1/holdings` and
   * replaces the in-memory store. Cache-then-server pattern: callers see
   * the localStorage snapshot immediately (via {@link #bootstrap}), then
   * this method overwrites it with the authoritative server state ~1
   * round-trip later. On network / 5xx errors we keep the cached state —
   * the global HTTP interceptor (separate file) surfaces the snackbar.
   */
  private hydrateFromBackend(): void {
    // Drain any DELETEs that were queued during a prior offline session.
    // Best-effort — the OfflineStorageService clears the queue on read,
    // and any re-failure re-enqueues via `deleteHolding`'s catchError.
    this.drainFailedDeletes();

    this.api.list().subscribe({
      next: (dtos) => {
        const list = dtos
          .map(HoldingService.fromApiDto)
          .map((h) => ({ ...h, isSaved: true }));
        this.store$.dispatch(
          loadHoldings({ state: { holdingsList: list } }),
        );
      },
      error: () => {
        // Keep whatever localStorage cache already populated the store.
        // User sees stale data + a global snackbar from the HTTP interceptor.
      },
    });
  }

  private drainFailedDeletes(): void {
    const queue = this.offlineStorage.drainDeletes(HoldingService.DELETE_QUEUE_KEY);
    for (const id of queue) {
      this.api.delete(id)
        .pipe(catchError((err: HttpErrorResponse) => {
          if (HoldingService.isTransient(err)) {
            this.offlineStorage.enqueueDelete(HoldingService.DELETE_QUEUE_KEY, id);
          }
          return EMPTY;
        }))
        .subscribe();
    }
  }

  /**
   * Maps a backend {@link HoldingApiDto} to the frontend {@link IHolding}
   * shape. Account id is stringified to align with the UI's mixed-id
   * convention (legacy 'manual' string + numeric ids from real accounts).
   * {@code lockMeta} round-trips as-is (Liquibase 2.0.5 persists it as
   * JSONB with the {@code kind} discriminator the frontend already uses).
   */
  private static fromApiDto(d: HoldingApiDto): IHolding {
    return {
      id: d.id,
      instrumentId: d.instrumentId,
      accountId: d.accountId != null ? String(d.accountId) : undefined,
      accountName: d.accountName ?? undefined,
      accountKind: (d.accountKind as AccountKind | null) ?? undefined,
      openedAt: d.openedAt ?? undefined,
      quantity: d.quantity,
      averageBuyPrice: d.averageBuyPrice,
      currency: d.currency ?? '',
      tagIds: d.tagIds ?? [],
      lockMeta: (d.lockMeta as IHolding['lockMeta'] | null) ?? undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

}
