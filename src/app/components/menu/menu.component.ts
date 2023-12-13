import { Component } from '@angular/core';
import { INavItem, MENU } from 'src/app/domain/app-shared.domain';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent {
  public menu: INavItem[] = MENU;
}
