import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AddTriggerService {

  private buttonClickSource = new Subject<void>();
  public buttonClick$ = this.buttonClickSource.asObservable();

  public triggerButtonClick(): void {
    this.buttonClickSource.next();
  }
}
