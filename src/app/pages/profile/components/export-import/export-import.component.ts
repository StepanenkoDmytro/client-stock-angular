import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { PageHeaderComponent } from '../../../../core/UI/components/page-header/page-header.component';
import { SettingsCardComponent } from '../../../../core/UI/components/settings-card/settings-card.component';
import { SettingsRowComponent } from '../../../../core/UI/components/settings-row/settings-row.component';

@Component({
  selector: 'pgz-export-import',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SettingsCardComponent, SettingsRowComponent],
  templateUrl: './export-import.component.html',
  styleUrl: './export-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportImportComponent {
  constructor(private router: Router) { }

  public prevRoute(): void {
    this.router.navigate(['/profile']);
  }

  public importSpendings(): void {
    this.router.navigate(['/profile/import-spendings']);
  }
}
