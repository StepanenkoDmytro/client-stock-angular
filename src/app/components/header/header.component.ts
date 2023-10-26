import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() isSidenavOpenedChange = new EventEmitter<boolean>();
  public isSidenavOpened = false;

  public switchToggleSidenav() {
    this.isSidenavOpened = !this.isSidenavOpened;
    this.isSidenavOpenedChange.emit(this.isSidenavOpened);
  }
}
