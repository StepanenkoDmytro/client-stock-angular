import { Injectable } from '@angular/core';
import { ILoginFormData } from '../../domain/auth.domain';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _authToken: string = '';

  constructor(
    private readonly router: Router,
  ) { }

  public get authToken(): string {
    if (!this._authToken) {
      // throw new Error('Auth token is absent.');
      console.error('Auth token is absent.');
      this.router.navigate(['/auth']);
    }

    return this._authToken;
  }

  public loginOrRegister(data: ILoginFormData): Observable<any> {
    console.log('Making request to server with data: ', data);
    // this._authToken = response;
    return of(true);
  }

  public loginWithGoogle(): any {
  }

  public restorePassword(): Observable<any> {
    return of(true);
  }

  public logOut(): Observable<any> {
    console.log('Making request to server to Log Out User');
    this._authToken = '';
    return of(true);
  }
}
