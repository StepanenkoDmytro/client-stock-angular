import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailStateService {

  public userEmail: string = '';
  public recoveryCode: string = '';
}
