import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { IconComponent } from '../icon/icon.component';
import { CUSTOM_ICONS, Icon } from '../../../../domain/icons.domain';

@Component({
  selector: 'pgz-icons-picker',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './icons-picker.component.html',
  styleUrl: './icons-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconsPickerComponent {
  @Input() 
  public isDropdownOpen: boolean = false;
  @Output() 
  iconSelected: EventEmitter<string> = new EventEmitter<string>();
  public selectedIcon: string | null = null;
  public CUSTOM_ICONS: Icon[] = CUSTOM_ICONS;

  constructor(
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) {
    this.CUSTOM_ICONS.forEach(icon => {
      this.iconRegistry.addSvgIcon(icon.name, this.sanitizer.bypassSecurityTrustResourceUrl(icon.url));
    });
  }

  public selectIcon(icon: string) {
    this.selectedIcon = icon;
    this.iconSelected.emit(icon);
    this.isDropdownOpen = false; 
  }
}
