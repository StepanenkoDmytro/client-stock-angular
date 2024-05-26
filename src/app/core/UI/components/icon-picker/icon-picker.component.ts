import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { IconService } from '../../../../service/icon.service';
import { IconComponent } from '../icon/icon.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

const UI_MODULES = [
  IconComponent
];

const MATERIAL_MODULES = [
  FormsModule, 
  MatFormFieldModule, 
  MatInputModule, 
  MatIconModule,
  ReactiveFormsModule
];

@Component({
  selector: 'pgz-icon-picker',
  standalone: true,
  imports: [...UI_MODULES, ...MATERIAL_MODULES],
  templateUrl: './icon-picker.component.html',
  styleUrl: './icon-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconPickerComponent implements OnInit {
  public icons: string[];
  public filteredIcons: string[];
  public showIconPicker: boolean = false;
  public filterCtrl: FormControl<string> = new FormControl<string>('');

  @Output()
  public onSelectIcon: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private iconService: IconService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) { }
  
  public ngOnInit(): void {
    this.iconService.getGoogleIcons().subscribe(icons => {
      this.filteredIcons = icons;
      this.icons = icons;
      this.cdr.detectChanges();
    });

    this.filterCtrl.valueChanges.subscribe(value => {
      this.searchIcon(value);
    });
  }

  public showPicker(): void {
    this.showIconPicker = !this.showIconPicker;
  }

  public selectIcon(icon: string): void {
    this.showIconPicker = !this.showIconPicker;
    this.onSelectIcon.emit(icon);
  }

  public searchIcon(value: string): void {
    this.filteredIcons = this.icons.filter(icon => icon.includes(value));
  }

  public clearFilter(): void {
    this.filterCtrl.setValue('');
  }

  @HostListener('document:click', ['$event'])
  public onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showIconPicker = false;
    }
  }
}
