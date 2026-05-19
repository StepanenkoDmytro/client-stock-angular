import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, retry, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ILoginFormData } from '../domain/auth.domain';
import { UserService } from './user.service';
import { IUserApiResponse } from '../domain/user.domain';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authTokenKey = 'authToken';
  private readonly url: string = `${environment.apiBaseUrl}/auth/`;

  private _authToken: string = '';

  constructor(
    private userService: UserService,
    private readonly httpClient: HttpClient,
  ) { }

  public get authToken(): string {
    if (!this._authToken) {
      // throw new Error('Auth token is absent.');
      return localStorage.getItem(this.authTokenKey);
    }

    return this._authToken;
  }

  public login(data: ILoginFormData): Observable<boolean> {
    const loginUrl: string = this.url + 'sign-in';
    return this.httpClient.post<IUserApiResponse>(loginUrl, data).pipe(
      switchMap( (resp: IUserApiResponse) => {
        this.userService.saveUser(resp.user);
        this._authToken = resp.token;
        localStorage.setItem(this.authTokenKey, this._authToken);

        return of(true);
      }),
      catchError( (error: Error) => {
        this.handleApiError(error);
        return of(false);
      })
    );
  }

  public register(data: ILoginFormData): Observable<boolean> {
    const loginUrl: string = this.url + 'sign-up';

    return this.httpClient.post(loginUrl, data).pipe(
      map(() => true),
      catchError( (error: Error) => {
        this.handleApiError(error);
        return of(false);
      })
    );
  }

  public loginWithGoogle(data: string): Observable<boolean> {
    const loginUrl: string = this.url + 'google-sign-up';

    return this.httpClient.post(loginUrl, data).pipe(
      switchMap( (resp: any) => {
        this.userService.saveUser(resp.user);
        this._authToken = resp.token;
        localStorage.setItem(this.authTokenKey, this._authToken);
        return of(true);
      }),
      catchError( (error: Error) => {
        this.handleApiError(error);
        return of(false);
      })
    );
  }

  public sendRecoveryCode(email: string): Observable<string> {
    const sendCodeUrl: string = this.url + 'send-code';
    const request = { email: email };
    return this.httpClient.post<{ code: string }>(sendCodeUrl, request).pipe(
      map(resp => resp.code),
      catchError((error: Error) => {
        this.handleApiError(error);
        //TODO: ask ALex about return after error
        return '';
      })
    );
  }

  public changePassword(recoveryCode: string, email: string, newPassword: string): Observable<boolean> {
    const changePasswordUrl: string = this.url + 'reset-password';
    const request = { 
      email: email ,
      code: recoveryCode,
      newPassword: newPassword
    };
    
    return this.httpClient.post(changePasswordUrl, request)
      .pipe(map((resp) => {
        console.log(resp);
        return true;
      }),
      catchError( (error: Error) => {
        this.handleApiError(error);
        return of(false);
        })
      );
  }

  public logOut(): void {

    this._authToken = '';
    localStorage.removeItem(this.authTokenKey);

    this.userService.logout();
  }

  /**
   * Silent JWT refresh. Backend `POST /auth/refresh-token` accepts the
   * old (expired) token in the raw request body and returns
   * `{user, token}` with a fresh one. Used by the global error
   * interceptor to retry a 401-failed request once before falling back
   * to logout+redirect.
   *
   * <p>Resolves to the new token string on success, or `null` on
   * failure (network, 401 from backend meaning the token is too far
   * gone to refresh). Callers MUST treat `null` as "session is dead".
   */
  public refresh(): Observable<string | null> {
    const current = this.authToken;
    if (!current) {
      return of(null);
    }
    const url = this.url + 'refresh-token';
    return this.httpClient.post<IUserApiResponse>(url, current).pipe(
      switchMap((resp) => {
        this.userService.saveUser(resp.user);
        this._authToken = resp.token;
        localStorage.setItem(this.authTokenKey, this._authToken);
        return of(this._authToken as string | null);
      }),
      catchError(() => of(null)),
    );
  }

  private handleApiError(error: Error): void {
    console.log(error);
    // TODO: Handle error;
  }
}
