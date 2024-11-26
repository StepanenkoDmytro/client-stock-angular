import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { IconComponent } from '../icon/icon.component';

const MATERIAL_MODULES = [
  MatFormFieldModule,
  MatSelectModule,
  MatTabsModule,
  MatSidenavModule,
  MatIconModule,
  MatButtonModule,
  MatDatepickerModule, 
  FormsModule, 
  ReactiveFormsModule,
  MatCheckboxModule,
  CommonModule
];

@Component({
  selector: 'pgz-filter-wrapper',
  standalone: true,
  imports: [...MATERIAL_MODULES, IconComponent],
  templateUrl: './filter-wrapper.component.html',
  styleUrl: './filter-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterWrapperComponent<T extends { id: string; title: string }> {
  @Input() items: T[] = [];
  @Input() selectedIds: Set<any>;
  @Input() contentTemplate!: any;

  @Output() selectedIdsChange = new EventEmitter<Set<any>>();

  get isAllSelected(): boolean {
    return this.selectedIds.size == this.items.length;
  }

  toggleAllSelection(): void {
    if (this.isAllSelected) {
      this.selectedIds = new Set();
    } else {
      this.selectedIds = new Set(this.items.map(item => item.id));
    }
    this.selectedIdsChange.emit(this.selectedIds);
  }
  

  toggleItem(id: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.selectedIdsChange.emit(this.selectedIds);
  }
}
