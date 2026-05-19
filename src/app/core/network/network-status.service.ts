import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';

/**
 * Reactive wrapper around `navigator.onLine` for `/savings` offline UX
 * (live-prices doc §3) and the global offline banner (PR4).
 *
 * <p>Why a service: `navigator.onLine` itself is not reactive, and the
 * `'online'` / `'offline'` window events need a single subscriber rather
 * than one per component. The service keeps an Angular Signal in sync
 * with the events so any consumer can read it inside a `computed(...)`.
 *
 * <p>Caveat (live-prices doc §3 footnote): the browser flag is not
 * authoritative — a phone connected to wi-fi without internet still
 * reports `onLine: true`. The real source of truth is HTTP errors from
 * the API interceptor. For PR3/PR4 we accept the trade-off; CC-6 will
 * layer an `httpDown` signal on top once it lands.
 */
@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly _online = signal<boolean>(this.initialState());

  /** Read-only signal — `true` when the browser thinks we're online. */
  public readonly online: Signal<boolean> = this._online.asReadonly();

  constructor() {
    if (typeof window === 'undefined') {
      // SSR / non-browser environment — leave the signal at its initial
      // optimistic `true` and skip event registration.
      return;
    }
    const onOnline = () => this._online.set(true);
    const onOffline = () => this._online.set(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    });
  }

  /**
   * Force a re-read of `navigator.onLine`. The browser fires `'online'` /
   * `'offline'` events when the connection state actually flips, so the
   * signal usually stays in sync on its own. Manual re-check is for the
   * retry button on the offline placeholder — the user has reason to
   * believe the state changed (just toggled wi-fi) and wants the UI to
   * confirm right away.
   */
  recheck(): void {
    this._online.set(this.initialState());
  }

  private initialState(): boolean {
    if (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') {
      return true;
    }
    return navigator.onLine;
  }
}
