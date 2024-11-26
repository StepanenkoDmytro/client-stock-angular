import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AddTriggerService {
  private buttonClickSource = new BehaviorSubject<string | null>(null);
  public buttonClick$ = this.buttonClickSource.asObservable();

  constructor(private router: Router) {}

  public triggerButtonClick(): void {
    const currentPath = this.router.url; 
    this.buttonClickSource.next(currentPath);
  }

  public resetButtonClick(): void {
    this.buttonClickSource.next(null);
  }
}
