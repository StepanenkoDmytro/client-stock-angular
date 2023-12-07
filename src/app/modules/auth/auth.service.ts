import { Injectable } from '@angular/core';
import { ILoginFormData } from '../../domain/auth.domain';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { AppSettingsService } from '../../app-settings/services/app-settings.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _authToken: string = '';
  private _pathToNavigateAfterLogin: string = '';

  constructor(
    private readonly router: Router,
    private readonly httpClient: HttpClient,
    private readonly apiService: AppSettingsService,
  ) { }

  public get authToken(): string {
    return this._authToken;
  }

  public navigateToAuthPage(): void {
    this._pathToNavigateAfterLogin = this.router.url;
    this.router.navigate(['/auth']);
  }

  public loginOrRegister(data: ILoginFormData): Observable<boolean> {
    const loginUrl: string = this.apiService.baseUrl + this.apiService.authApi['sign-in'];

    return this.httpClient.post(loginUrl, data).pipe(
      switchMap( (resp: any) => {
        this._authToken = resp['token'];

        if (this._pathToNavigateAfterLogin) {
          const pathToNavigate = this._pathToNavigateAfterLogin || '/';
          this.router.navigate([pathToNavigate]);
          this._pathToNavigateAfterLogin = '';
        }

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
    // TODO: Handle error case
    return of(true);
  }

  private handleApiError(error: Error): void {
    console.log(error);
    // TODO: Handle error;
  }
}
