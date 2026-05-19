import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../../service/auth.service';

/**
 * Global HTTP error interceptor.
 *
 * <p>Three classes of error get a uniform UX treatment that no per-call
 * site has to repeat:
 *
 * <ul>
 *   <li><b>401 Unauthorized</b> — try a silent refresh via
 *       {@code POST /auth/refresh-token} and replay the failed request
 *       with the new token. If refresh itself fails (already-too-far-gone
 *       token, refresh endpoint also returned 401), clear local auth
 *       state, redirect to the login screen, show a "Session expired"
 *       snackbar. Concurrent 401s share one in-flight refresh via
 *       {@link #refreshSubject}.</li>
 *   <li><b>Network / status 0</b> — browser couldn't reach the server.
 *       "No connection — try again" snackbar so the user knows it wasn't
 *       a silent failure.</li>
 *   <li><b>5xx</b> — server error. Generic snackbar.</li>
 * </ul>
 *
 * <p>4xx client errors (400, 404, 409, 422) are passed through silently —
 * they are user-actionable and the calling component renders a contextual
 * message (e.g. "Holding already exists at this account").
 *
 * <p>{@code /auth/*} requests are exempt — a bad sign-in / refresh
 * endpoint 401 is "wrong password", not "session expired"; the login
 * form renders its own inline error.
 */
@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  /**
   * In-flight refresh state. `null` while idle. While a refresh is
   * pending, all subsequent 401s wait on the same {@code ReplaySubject}
   * (replay=1 so latecomers get the outcome immediately). Each emission
   * is the new token, or `null` if the refresh failed.
   */
  private refreshSubject: ReplaySubject<string | null> | null = null;

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !isAuthEndpoint(req.url)) {
          return this.handle401(req, next);
        }
        if (err.status === 0) {
          this.toast('No connection — check your network and try again.');
        } else if (err.status >= 500 && err.status < 600) {
          this.toast('Server error — please try again in a moment.');
        }
        // Always rethrow so per-call .error handlers can roll back loading
        // state, snackbar contextual messages, etc.
        return throwError(() => err);
      }),
    );
  }

  /**
   * 401 handler: piggyback on (or start) a single refresh, then replay
   * the original request with the new bearer token. If refresh fails →
   * logout + redirect; rethrow the ORIGINAL 401 so per-call sites still
   * clean up loading state.
   */
  private handle401(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    if (!this.refreshSubject) {
      this.refreshSubject = new ReplaySubject<string | null>(1);
      this.auth.refresh().subscribe({
        next: (token) => {
          this.refreshSubject!.next(token);
          this.refreshSubject!.complete();
          this.refreshSubject = null;
        },
        error: () => {
          this.refreshSubject!.next(null);
          this.refreshSubject!.complete();
          this.refreshSubject = null;
        },
      });
    }

    return this.refreshSubject.pipe(
      filter((v) => v !== undefined),
      take(1),
      switchMap((token) => {
        if (!token) {
          this.handleSessionLost();
          return throwError(() => new Error('Session expired'));
        }
        // Replay the original request with the fresh bearer header.
        // JwtInterceptor reads `authService.authToken` which is already
        // updated; rebuild the request so it picks up the new value.
        const retried = req.clone({
          setHeaders: { Authorization: `Bearer_${token}` },
        });
        return next.handle(retried);
      }),
    );
  }

  private handleSessionLost(): void {
    this.auth.logOut();
    this.toast('Session expired — please sign in again.');
    this.router.navigate(['/sign-in']);
  }

  private toast(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 4000 });
  }
}

/**
 * Auth endpoints (`/api/v1/auth/sign-in`, `/sign-up`, `/refresh-token`, ...)
 * legitimately return 401 for bad credentials / unrefreshable token —
 * that's not "session expired", it's "you typed the wrong password" or
 * "the refresh endpoint itself failed". The login form handles its own
 * inline error rendering; the refresh path is handled by {@link
 * ApiErrorInterceptor#handle401} which calls `auth.refresh()` directly.
 */
function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/');
}
