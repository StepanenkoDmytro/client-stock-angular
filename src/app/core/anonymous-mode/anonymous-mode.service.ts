import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../service/auth.service';

/**
 * Tracks the anonymous-mode lifecycle for the UX disclosure
 * (Profile section) and the 7-day soft nudge (ADR-0012 §"Anonymous mode
 * UX" + Phase 3b PR3).
 *
 * <p>"Anonymous" = the user has no `authToken`. The check is intentionally
 * coarse — we don't distinguish "never signed up" from "signed out". Both
 * are local-only data on this device. The nudge nudges them to back up;
 * a returning logged-out user already had cloud sync once and presumably
 * knows the trade-off.
 *
 * <p>First-anonymous-use timestamp is recorded the moment the service is
 * read while anonymous. The nudge fires once daily-since-first-use is
 * past the threshold, and only re-fires after a dismiss-grace-period so
 * the user isn't pestered.
 */
@Injectable({ providedIn: 'root' })
export class AnonymousModeService {
  /**
   * Soft nudge threshold per ADR-0012 §"Anonymous mode UX". Default 7
   * days from the first anonymous use; configurable via the open
   * question in ADR-0012 once we get waitlist feedback.
   */
  private static readonly NUDGE_AFTER_DAYS = 7;

  /**
   * Re-show window after a dismiss. The user dismisses → we hold for 14
   * days, then re-evaluate against the same first-use timestamp. Keeps
   * the nudge alive without being a pest.
   */
  private static readonly NUDGE_REPEAT_DAYS = 14;

  private static readonly FIRST_USE_KEY = 'anonymous-first-use';
  private static readonly LAST_DISMISS_KEY = 'anonymous-nudge-dismissed';

  /**
   * Auth-token tick. Updated every time {@link refresh} is called (the
   * auth service doesn't expose a Signal yet, so callers that mutate
   * auth state nudge this service via `refresh()`).
   */
  private readonly _authTick = signal(0);

  private readonly auth = inject(AuthService);

  /**
   * `true` when the current user has no auth token. Recomputes whenever
   * {@link refresh} is called — keep it cheap, the auth-token lookup is a
   * memory + localStorage read.
   */
  public readonly isAnonymous: Signal<boolean> = computed(() => {
    this._authTick();
    return !this.auth.authToken;
  });

  /**
   * `true` when the disclosure-derived nudge banner should be shown:
   * anonymous user, past the threshold, hasn't dismissed recently.
   * Components reading this use it inside an `@if` in the template.
   */
  public readonly shouldShowNudge: Signal<boolean> = computed(() => {
    if (!this.isAnonymous()) {
      return false;
    }
    const firstUseMs = this.readFirstUseTimestamp();
    if (firstUseMs === null) {
      // First read this session — record it. Doesn't trigger the nudge
      // immediately; nudge fires once enough days have passed.
      this.recordFirstUse();
      return false;
    }
    const daysSinceFirstUse = (Date.now() - firstUseMs) / 86_400_000;
    if (daysSinceFirstUse < AnonymousModeService.NUDGE_AFTER_DAYS) {
      return false;
    }
    const lastDismissMs = this.readLastDismissTimestamp();
    if (lastDismissMs !== null) {
      const daysSinceDismiss = (Date.now() - lastDismissMs) / 86_400_000;
      if (daysSinceDismiss < AnonymousModeService.NUDGE_REPEAT_DAYS) {
        return false;
      }
    }
    return true;
  });

  /**
   * Tell the service to re-evaluate `isAnonymous` (and downstream
   * `shouldShowNudge`). Call after login / signup / logout. Cheap —
   * just bumps a counter signal.
   */
  refresh(): void {
    this._authTick.update((n) => n + 1);
  }

  /**
   * User dismissed the nudge — record the timestamp so we don't re-show
   * for {@link NUDGE_REPEAT_DAYS} days. Anonymous account on a clean
   * browser will re-see the nudge after the grace period naturally.
   */
  dismissNudge(): void {
    try {
      localStorage.setItem(
        AnonymousModeService.LAST_DISMISS_KEY,
        String(Date.now()),
      );
    } catch {
      // Quota — best-effort.
    }
    this.refresh();
  }

  private recordFirstUse(): void {
    try {
      localStorage.setItem(
        AnonymousModeService.FIRST_USE_KEY,
        String(Date.now()),
      );
    } catch {
      // Quota — silently skip; means the nudge never fires for this
      // user, which is preferable to crashing the disclosure.
    }
  }

  private readFirstUseTimestamp(): number | null {
    const raw = localStorage.getItem(AnonymousModeService.FIRST_USE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private readLastDismissTimestamp(): number | null {
    const raw = localStorage.getItem(AnonymousModeService.LAST_DISMISS_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}
