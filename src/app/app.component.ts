import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NavigationComponent } from './core/UI/components/navigation/navigation.component';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DarkLightModeService } from './service/dark-light-mode.service';
import { UserService } from './service/user.service';


const ANGULAR_MODULES = [
  CommonModule,
  RouterOutlet,
];

const UI_MODULES = [
  MatSlideToggleModule,
  NavigationComponent,
  MatIconModule,
  MatToolbarModule,
];


@Component({
  selector: 'pgz-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [...ANGULAR_MODULES, ...UI_MODULES],
})
export class AppComponent implements OnInit {
  public title: string = 'PEGAZZO';

  private CUSTOM_SVG_ICONS = [
    { name: 'custom_clothes', url: 'assets/expend/clothes.svg'},
    { name: 'custom_drink', url: 'assets/expend/drink.svg'},
    { name: 'custom_gift', url: 'assets/expend/gift.svg'},
    { name: 'custom_car', url: 'assets/expend/car.svg'},
    { name: 'custom_health', url: 'assets/expend/health.svg'},
    { name: 'custom_food', url: 'assets/expend/food.svg'},
    { name: 'custom_house', url: 'assets/expend/house.svg'},
    { name: 'custom_pet', url: 'assets/expend/pet.svg'},
  ]

  constructor(
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private darkLightModeService: DarkLightModeService,
    private userService: UserService
  ) {
    this.CUSTOM_SVG_ICONS.forEach(icon => {
      this.iconRegistry.addSvgIcon(icon.name, this.sanitizer.bypassSecurityTrustResourceUrl(icon.url));
    });
  }

  public ngOnInit(): void {
    const isFirstVisit = this.darkLightModeService.mode === null;
    if(isFirstVisit) {
      this.darkLightModeService.set('light');
    } else {
      this.darkLightModeService.set(this.darkLightModeService.mode);
    }

    this.userService.init();
  }
}
