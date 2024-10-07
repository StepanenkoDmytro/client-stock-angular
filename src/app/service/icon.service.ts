import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  private readonly url: string = 'https://pegazzo.online:8000/api/v1/icons/';

  constructor(
    private http: HttpClient,
  ) { }

  public getGoogleIcons(): Observable<string[]> {
    return this.http.get<string[]>(this.url);
  }
}
