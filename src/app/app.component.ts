import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NavigationComponent } from './core/UI/components/navigation/navigation.component';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { IconComponent } from './core/UI/components/icon/icon.component';
import { HttpClientModule } from '@angular/common/http';


@Component({
  selector: 'pgz-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatSlideToggleModule, NavigationComponent, MatIconModule],
})
export class AppComponent {
  title = 'PEGAZZO';

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
    private sanitizer: DomSanitizer
  ) {
    this.CUSTOM_SVG_ICONS.forEach(icon => {
      this.iconRegistry.addSvgIcon(icon.name, this.sanitizer.bypassSecurityTrustResourceUrl(icon.url));
    });
  }
}
