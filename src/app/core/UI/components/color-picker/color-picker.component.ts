import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { colorPalette } from '../../../../domain/d3.domain';

@Component({
  selector: 'pgz-color-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPickerComponent {
  @Input() 
  public isDropdownOpen: boolean = false;
  @Input()
  public set occupiedColors(value: string[]) {
    this._occupiedColors = new Set(value);
  }
  @Output() 
  colorSelected: EventEmitter<string> = new EventEmitter<string>();

  public _occupiedColors: Set<string>;
  public colors: string[] = colorPalette;
  public selectedColor: string | null = null;

  public toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  public selectColor(color: string): void {
    this.selectedColor = color;
    this.colorSelected.emit(color);
    this.isDropdownOpen = false; 
  }

  public isOccupiedColor(color: string): boolean {
    return this._occupiedColors.has(color.toLocaleUpperCase());
  }
}
