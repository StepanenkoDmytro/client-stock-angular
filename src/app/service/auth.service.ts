import { Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ILoginFormData } from '../domain/auth.domain';
import { UserService } from './user.service';
import { IUserApiResponse } from '../domain/user.domain';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authTokenKey = 'authToken';
  private readonly url: string = 'http://pegazzo.online:8000/api/v1/auth/';

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

  public restorePassword(): Observable<any> {
    return of(true);
  }

  public logOut(): void {
    
    this._authToken = '';
    localStorage.removeItem(this.authTokenKey);

    this.userService.logout();
  }

  private handleApiError(error: Error): void {
    console.log(error);
    // TODO: Handle error;
  }
}
