import { Injectable } from '@angular/core';

const environment = {
  API_URLS: {
    domain: 'https://pegazzo-backend.onrender.com',
    api: {
      v1: '/api/v1',
    },
    services: {
      auth: {
        'sign-in': '/auth/sign-in',
        'sign-out': '/auth/sign-out'
      }
    }
  },
}

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

  public get authApi(): IAppApi {
    return this.apiUrls.services.auth;
  }
}
