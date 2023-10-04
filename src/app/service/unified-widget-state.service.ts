import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UnifiedWidgetStateService {
  static url = 'https://widget-state-default-rtdb.firebaseio.com/';

  constructor(private http: HttpClient) { }

  private primaryComponents: string[] = [];
  private workComponents: string[] = [];

  getPrimaryComponents(): string[] {
    return this.primaryComponents;
  }

  getWorkComponents(): string[] {
    return this.workComponents;
  }

  public savePrimaryState(primary: string[]): void {

  }

  public saveWorkState(work: string[]): void {
    
  }
}
