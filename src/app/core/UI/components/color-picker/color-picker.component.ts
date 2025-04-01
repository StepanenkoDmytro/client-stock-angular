import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

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
  public colors: string[] = 
  [
    '#D5DB24', '#B60D0D', '#C14619', '#88400C', '#A36A10', '#D3680B', '#F29500',
    '#C89D11', '#EECA00', '#E3E300', '#AAC800', '#7EA401', '#54A305', '#007924',
    '#54B189', '#408869', '#185A3E', '#67BAB6', '#2E9E99', '#00768B', '#39779D',
    '#005183', '#978FE0', '#645ABE', '#6140D9', '#422F87', '#976AA6', '#905EC5',
    '#9C47B9', '#AD16DF', '#8210A8', '#C460C6', '#B674A5', '#AC3EAE', '#CD00D1',
    '#8C4366', '#AB3F73', '#DF3185', '#BC025C', '#763E3F', '#56191A', '#480304'
  ];
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
