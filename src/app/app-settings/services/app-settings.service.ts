import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export type IAppApi = {
  [key: string]: string;
};

@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {

  private readonly apiUrls = environment.API_URLS;
  public readonly baseUrl: string = this.apiUrls.domain + this.apiUrls.api.v1;

  constructor() { }

  // TODO: Rework this bullshit
  public get authApi(): IAppApi {
    return this.apiUrls.services.auth;
  }
}
