import { Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ILoginFormData } from '../domain/auth.domain';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authTokenKey = 'authToken';
  private readonly url: string = 'http://localhost:8000/api/v1/auth/';

  private _authToken: string = '';

  constructor(
    private readonly router: Router,
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

    return this.httpClient.post(loginUrl, data).pipe(
      switchMap( (resp: any) => {
        this._authToken = resp['token'];
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
        // this._authToken = resp['token'];
        this._authToken = 'resp[]';
        return of(true);
      }),
      catchError( (error: Error) => {
        this.handleApiError(error);
        return of(false);
      })
    );
  }

  public loginWithGoogle(): any {
  }

  public restorePassword(): Observable<any> {
    return of(true);
  }

  public logOut(): Observable<any> {
    console.log('Making request to server to Log Out User');
    this._authToken = '';
    localStorage.removeItem(this.authTokenKey);
    return of(true);
  }

  private handleApiError(error: Error): void {
    console.log(error);
    // TODO: Handle error;
  }
}