import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { AuthService } from '../../service/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private readonly authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.includes('markets') || request.url.includes('auth')) {
      return next.handle(request);
    }

    const token = this.authService.authToken;
    
    if (!token) {
      return EMPTY;
    }

    request = request.clone({
      setHeaders: {
        Authorization: `Bearer_${token}`
      }
    });
    return next.handle(request);
  }
}
