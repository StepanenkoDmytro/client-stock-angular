import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private readonly authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.includes('sign-in')) {
      return next.handle(request);
    }

    const token = this.authService.authToken;
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer_${token}`
        }
      });
    }
    return next.handle(request);
  }
}
