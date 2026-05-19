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
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../service/auth.service';

/**
 * Global HTTP error interceptor.
 *
 * <p>Three classes of error get a uniform UX treatment that no per-call
 * site has to repeat:
 *
 * <ul>
 *   <li><b>401 Unauthorized</b> — session is dead. Clear local auth state,
 *       redirect to the login screen, show a short "Session expired" hint.
 *       Skipped for `/auth/*` requests so a bad login attempt doesn't
 *       redirect mid-form (the login component renders its own inline
 *       error from the response body).</li>
 *   <li><b>Network / status 0</b> — browser couldn't reach the server.
 *       Show a "No connection — try again" snackbar so the user knows it
 *       wasn't a silent failure.</li>
 *   <li><b>5xx</b> — server error. Show a generic "Server error" snackbar.
 *       Per-call sites still get the error in their {@code subscribe.error}
 *       handler so they can roll back loading state, but the user-facing
 *       snackbar is centralised here to avoid duplicate toasts.</li>
 * </ul>
 *
 * <p>4xx client errors (400, 404, 409, 422) are passed through silently —
 * they are user-actionable and the calling component is responsible for
 * rendering a contextual message (e.g. "Holding already exists at this
 * account"). Showing two snackbars for the same response is worse than
 * showing none from here.
 */
@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !isAuthEndpoint(req.url)) {
          this.handleUnauthorized();
        } else if (err.status === 0) {
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

  private handleUnauthorized(): void {
    this.auth.logOut();
    this.toast('Session expired — please sign in again.');
    this.router.navigate(['/sign-in']);
  }

  private toast(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 4000 });
  }
}

/**
 * The auth endpoints (`/api/v1/auth/sign-in`, `/sign-up`, `/refresh`, etc.)
 * legitimately return 401 for bad credentials — that's not "session
 * expired", it's "you typed the wrong password". The login form handles
 * its own inline error rendering.
 */
function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/');
}
