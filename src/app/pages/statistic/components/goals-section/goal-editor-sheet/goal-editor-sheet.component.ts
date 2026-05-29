import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IGoal } from '../../../../../domain/goals.domain';
import { CurrencySymbolPipe } from '../../../../../pipe/currency-symbol.pipe';

/**
 * Bottom-sheet payload for the goal editor.
 *
 *   goal      — the goal to edit, or `null` to create a new one.
 *   currency  — display-currency code (USD / EUR / UAH) for the sum suffix.
 */
export interface GoalEditorSheetData {
  goal: IGoal | null;
  currency: string;
}

/** `{ goal }` on Save, `'cancel'` on dismiss. */
export type GoalEditorSheetResult = { goal: IGoal } | 'cancel';

interface StatusOption {
  name: string;
  value: string;
}

/**
 * Add / Edit goal bottom-sheet — the single goal-management surface after
 * the `/goals` page was deprecated (decision 2026-05-29, mockup
 * analytics/16). Reuses the legacy add-goal fields (name / target sum /
 * status / share) and adds an optional **target date**, which the
 * Statistics projection + gap analysis need for ETA.
 *
 * Presentation-only: dismisses the built `IGoal` to the caller, which
 * decides add vs update (so the sheet stays free of persistence concerns,
 * matching `EditCategorySheetComponent`).
 */
@Component({
  selector: 'pgz-goal-editor-sheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    CurrencySymbolPipe,
  ],
  templateUrl: './goal-editor-sheet.component.html',
  styleUrl: './goal-editor-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalEditorSheetComponent implements OnInit {
  public name = '';
  public finishSum: number | null = null;
  public status = 'success';
  public share: number | null = null;
  /** Native `<input type="month">` value, `YYYY-MM`. */
  public targetMonth = '';

  public readonly isEdit: boolean;

  public readonly statuses: ReadonlyArray<StatusOption> = [
    { name: 'Fixed sum', value: 'success' },
    { name: 'Share of portfolio', value: 'progress' },
    { name: 'Not included in the portfolio', value: 'disabled' },
  ];

  constructor(
    private readonly ref: MatBottomSheetRef<
      GoalEditorSheetComponent,
      GoalEditorSheetResult
    >,
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public readonly data: GoalEditorSheetData,
  ) {
    this.isEdit = data.goal != null;
  }

  ngOnInit(): void {
    const g = this.data.goal;
    if (g) {
      this.name = g.name ?? '';
      this.finishSum = g.finishSum ?? null;
      this.status = g.status ?? 'success';
      this.share = g.share ?? null;
      this.targetMonth = this.toMonthInput(g.approximateDate);
    }
  }

  public canSave(): boolean {
    return this.name.trim().length > 0 && (this.finishSum ?? 0) > 0;
  }

  public save(): void {
    if (!this.canSave()) return;
    const src = this.data.goal;
    const goal: IGoal = {
      // Preserve id / isDemo / archived on edit; spread first so the form
      // fields below win.
      ...(src ?? ({} as IGoal)),
      name: this.name.trim(),
      finishSum: Number(this.finishSum),
      status: this.status,
      // `share` only carries meaning for "Share of portfolio" goals; for
      // other statuses keep whatever the source had (parity with the legacy
      // add-goal form — share-unit unification is tracked separately).
      share: this.status === 'progress' ? this.share ?? 0 : src?.share,
      approximateDate: this.fromMonthInput(this.targetMonth),
    };
    this.ref.dismiss({ goal });
  }

  public cancel(): void {
    this.ref.dismiss('cancel');
  }

  private toMonthInput(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}`;
  }

  private fromMonthInput(value: string): Date | undefined {
    if (!value) return undefined;
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) return undefined;
    return new Date(year, month - 1, 1);
  }
}
