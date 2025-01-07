import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
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
    { name: 'custom_google', url: 'assets/expend/google.svg'},
    { name: 'custom_facebook', url: 'assets/expend/facebook.svg'},
    { name: 'custom_edit', url: 'assets/icons/edit.svg'},
    { name: 'custom_exit', url: 'assets/icons/exit.svg'},
    { name: 'custom_arrow-in', url: 'assets/icons/arrow-inside-up.svg'},
    { name: 'custom_settings', url: 'assets/icons/settings.svg'},
    { name: 'custom_filter', url: 'assets/icons/filter.svg'},
    { name: 'custom_statistic', url: 'assets/icons/statistic.svg'},
    { name: 'custom_color_icon', url: 'assets/icons/color_icon.svg'},
    { name: 'custom_calendar', url: 'assets/icons/calendar.svg'},
    { name: 'custom_priority', url: 'assets/icons/priority.svg'},
    { name: 'custom_wallet', url: 'assets/icons/wallet.svg'},
    { name: 'custom_profile-settings', url: 'assets/icons/profile-settings.svg'},
  ]

  constructor(
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private darkLightModeService: DarkLightModeService,
    private userService: UserService,
    private router: Router,
  ) {
    this.CUSTOM_SVG_ICONS.forEach(icon => {
      this.iconRegistry.addSvgIcon(icon.name, this.sanitizer.bypassSecurityTrustResourceUrl(icon.url));
    });
  }

  public ngOnInit(): void {
    //for nav height menu
    // const userAgent = window.navigator.userAgent;
    const isFirstVisit = this.darkLightModeService.mode === null;
    if(isFirstVisit) {
      this.darkLightModeService.set('light');
    } else {
      this.darkLightModeService.set(this.darkLightModeService.mode);
    }

    this.userService.init();
  }

  public isAuthPage(): boolean {
    return this.router.url.includes('auth');
  }
}
