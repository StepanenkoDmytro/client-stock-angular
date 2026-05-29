import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../../core/UI/components/page-header/page-header.component';
import { ILoopPosition, loopDisplayName } from '../../../../../domain/loop-position.domain';
import { SUPPORTED_BASE_CURRENCIES } from '../../../../../domain/user-preferences.domain';
import { FxRateService } from '../../../../../service/fx-rate.service';
import { LoopingService } from '../../../../../service/looping.service';
import { UserPreferencesService } from '../../../service/user-preferences.service';
import { LoopCardComponent } from '../loop-card/loop-card.component';

/**
 * Loop detail — the Holdings B-card page (mockup savings/14 right frame).
 * Thin wrapper: page-header + the presentational {@link LoopCardComponent} +
 * a ⋯ menu (Edit / Delete). Read-only, anonymous-safe (reads the loop from
 * the localStorage `LoopingService`).
 */
@Component({
  selector: 'pgz-loop-detail',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    LoopCardComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './loop-detail.component.html',
  styleUrl: './loop-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoopDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly loopingService = inject(LoopingService);
  private readonly userPrefs = inject(UserPreferencesService);
  private readonly fxRate = inject(FxRateService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly loops = toSignal(this.loopingService.getAll(), {
    initialValue: [] as ILoopPosition[],
  });

  private readonly loopId = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  public readonly displayCurrency = computed<string>(
    () => this.userPrefs.baseCurrency() ?? 'USD',
  );

  /** The loop matching the `:id` route param, or `null` when not found. */
  public readonly loop = computed<ILoopPosition | null>(() => {
    const id = Number(this.loopId().get('id'));
    if (!Number.isFinite(id)) return null;
    return this.loops().find((l) => l.id === id) ?? null;
  });

  public ngOnInit(): void {
    // FX preload so the card's synchronous `toBase` resolves on a deep-link
    // (the dashboard preloads too, but the user may land here directly).
    const base = this.userPrefs.baseCurrency() ?? 'USD';
    this.fxRate.preload(base, [...SUPPORTED_BASE_CURRENCIES]).subscribe();
  }

  public prevRoute(): void {
    this.router.navigate(['/savings']);
  }

  public onEdit(): void {
    const l = this.loop();
    if (l?.id != null) {
      this.router.navigate(['/savings/add-loop', l.id]);
    }
  }

  public onDelete(): void {
    const l = this.loop();
    if (!l) return;
    if (!window.confirm(`Delete “${loopDisplayName(l)}”? This can't be undone.`)) {
      return;
    }
    this.loopingService.deleteLoop(l);
    this.snackBar.open('Strategy deleted', 'Dismiss', { duration: 3000 });
    this.router.navigate(['/savings']);
  }
}
