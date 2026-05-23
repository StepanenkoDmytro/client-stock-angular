import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store, select } from '@ngrx/store';
import { AssetClass } from '../../domain/asset-class.domain';
import { IHolding } from '../../domain/holding.domain';
import { InstrumentService } from '../../pages/savings/service/instrument.service';
import { selectHoldingsList } from '../../pages/savings/store/holdings.selectors';

/**
 * Savings empty-states ladder tier per
 * `docs/notes/2026-05-savings-empty-states-ladder.md` §4.1.
 *
 * <p>Four states drive the SavingsComponent render branches (PR3 wires the
 * actual UI takeover; PR2 only computes the value).
 *
 * <ul>
 *   <li><b>T1_FIRST_VISIT</b> — `pgz-installed` marker absent. Cold start
 *       hero with 6-card Action Grid + «Try with demo data» link.</li>
 *   <li><b>T1_LIGHT</b> — marker present, zero distinct asset classes.
 *       Same hero, no «Try with demo data» link (user wiped on purpose).</li>
 *   <li><b>T2</b> — 1–2 distinct asset classes. Standard dashboard plus
 *       Discovery row.</li>
 *   <li><b>T3</b> — 3+ distinct asset classes. Standard dashboard, no
 *       Discovery row.</li>
 * </ul>
 */
export type SavingsTier = 'T1_FIRST_VISIT' | 'T1_LIGHT' | 'T2' | 'T3';

/**
 * SavingsTierService — single source of truth for the SavingsComponent
 * tier signal. Pure derivation from `pgz-installed` localStorage marker
 * (snapshot at construction) plus the live holdings list resolved
 * through {@link InstrumentService}.
 *
 * <p>Per task §6 PR2.
 */
@Injectable({ providedIn: 'root' })
export class SavingsTierService {
  private static readonly INSTALLED_KEY = 'pgz-installed';

  private readonly store$ = inject(Store);
  private readonly instruments = inject(InstrumentService);

  /**
   * Snapshot the first-visit marker once at service construction. Mid-
   * session writes via {@link #markInstalled} flip the live LS value but
   * do NOT flip this snapshot — so the user who lands on /savings with no
   * marker stays in T1_FIRST_VISIT for the rest of the session and the
   * «Try with demo data» link doesn't pop out from under them just
   * because AppComponent.ngOnInit ran. A page reload constructs a new
   * singleton, re-reads the marker, and routes the returning user
   * through T1_LIGHT / T2 / T3.
   */
  private readonly wasInstalledOnBoot =
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(SavingsTierService.INSTALLED_KEY) !== null;

  private readonly holdings = toSignal(
    this.store$.pipe(select(selectHoldingsList)),
    { initialValue: [] as IHolding[] },
  );

  /**
   * Distinct {@link AssetClass} set across live holdings, resolved
   * through {@link InstrumentService}. Holdings whose instrument hasn't
   * yet loaded into the cache (e.g. mid-bootstrap race) are skipped;
   * they show up correctly on the next computed re-run once the cache
   * settles.
   */
  private readonly distinctAssetClasses: Signal<Set<AssetClass>> = computed(() => {
    const list = this.holdings();
    const instMap = this.instruments.instruments();
    const seen = new Set<AssetClass>();
    for (const h of list) {
      const inst = instMap.get(h.instrumentId);
      if (inst) {
        seen.add(inst.assetClass);
      }
    }
    return seen;
  });

  /** Count of distinct asset classes — drives T1_LIGHT / T2 / T3 in {@link #tier}. */
  readonly distinctAssetClassCount: Signal<number> = computed(
    () => this.distinctAssetClasses().size,
  );

  /**
   * Top 3 {@link AssetClass} values missing from the user's portfolio,
   * ordered by the task §8 Q4 fallback chain
   * (Stocks → Real estate → Cash → Crypto → ETF → Deposit → Tokenized
   * → Other). Drives the T2 Discovery row chip set in
   * {@code DiscoveryRowComponent}. Recomputes reactively as the user
   * adds new classes — once the count of missing items drops below 3
   * the chip set shrinks, and at distinct ≥ 3 the parent template
   * stops rendering the row entirely (tier transitions to T3).
   */
  readonly discoveryClasses: Signal<AssetClass[]> = computed(() => {
    const present = this.distinctAssetClasses();
    return SavingsTierService.DISCOVERY_FALLBACK_ORDER
      .filter((c) => !present.has(c))
      .slice(0, 3);
  });

  private static readonly DISCOVERY_FALLBACK_ORDER: readonly AssetClass[] = [
    AssetClass.STOCK,
    AssetClass.REAL_ESTATE,
    AssetClass.CASH,
    AssetClass.CRYPTO,
    AssetClass.ETF,
    AssetClass.DEPOSIT,
    AssetClass.TOKENIZED_STOCK,
    AssetClass.OTHER,
  ];

  /**
   * Current savings tier. Pure function of {@link #wasInstalledOnBoot}
   * (static for the session) and {@link #distinctAssetClassCount} (live).
   *
   * <p>Data-first per task §4.2: once holdings appear (real OR demo) the
   * tier flips to T2 / T3 immediately, so «Try with demo data» on the
   * cold-start hero (PR3) transitions the user to T3 without waiting
   * for a reload. The first-visit marker only discriminates between
   * T1_FIRST_VISIT (cold, never opened) and T1_LIGHT (returning,
   * post-wipe) when there is no data at all. Boundaries per §4.1:
   * T2 = 1–2 classes, T3 = 3+ classes.
   */
  readonly tier: Signal<SavingsTier> = computed(() => {
    const classes = this.distinctAssetClassCount();
    if (classes >= 3) return 'T3';
    if (classes >= 1) return 'T2';
    return this.wasInstalledOnBoot ? 'T1_LIGHT' : 'T1_FIRST_VISIT';
  });

  /**
   * Idempotent first-visit marker write. Wired from
   * {@link AppComponent#ngOnInit} so the marker lands on the very first
   * app boot, regardless of which route the user enters from. Subsequent
   * calls — and subsequent app boots — are no-ops.
   */
  markInstalled(): void {
    if (this.wasInstalledOnBoot) return;
    try {
      localStorage.setItem(SavingsTierService.INSTALLED_KEY, '1');
    } catch {
      // Storage quota / private mode — non-critical; the in-memory
      // boot snapshot still drives the current session correctly.
    }
  }
}
