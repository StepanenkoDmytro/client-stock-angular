import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ITag, ITagTree } from '../../../../domain/tag.domain';
import { PrevRouteComponent } from '../../../../core/UI/components/prev-route/prev-route.component';
import { NotificationComponent } from '../../../../core/UI/components/notification/notification.component';
import { TagsService } from '../../service/tags.service';
import { selectTagTree } from '../../store/tags.selectors';
import {
  DeleteTagConfirmComponent,
  DeleteTagConfirmData,
  DeleteTagConfirmResult,
} from './delete-tag-confirm/delete-tag-confirm.component';

const MATERIAL_MODULES = [
  MatExpansionModule,
  MatIconModule,
  MatButtonModule,
  MatBottomSheetModule,
  MatSnackBarModule,
];

const UI_COMPONENTS = [PrevRouteComponent];

@Component({
  selector: 'pgz-tags',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_MODULES, ...UI_COMPONENTS],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly tagsService = inject(TagsService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly snackBar = inject(MatSnackBar);

  public readonly tagTree = toSignal(this.store.select(selectTagTree), {
    initialValue: [] as ITagTree[],
  });

  ngOnInit(): void {
    this.tagsService.init();
  }

  public goBack(): void {
    this.router.navigate(['/savings']);
  }

  public onAdd(): void {
    this.router.navigate(['/savings/tags/add']);
  }

  public onEdit(tag: ITag): void {
    this.router.navigate(['/savings/tags/edit', tag.id]);
  }

  public onDelete(tag: ITagTree, event: Event): void {
    event.stopPropagation();
    if (tag.system) {
      return;
    }

    const data: DeleteTagConfirmData = {
      tagName: tag.name,
      childrenCount: tag.children.length,
      // Holdings store lands in PR4; until then we don't know usage and
      // pass 0 (renders "This action cannot be undone." copy).
      usageCount: 0,
    };

    const ref = this.bottomSheet.open<
      DeleteTagConfirmComponent,
      DeleteTagConfirmData,
      DeleteTagConfirmResult
    >(DeleteTagConfirmComponent, { data });

    ref.afterDismissed().subscribe((result) => {
      if (result === 'delete') {
        this.tagsService.deleteTag(tag.id);
        this.showSnackbar(`Tag «${tag.name}» deleted`);
      }
    });
  }

  /**
   * Helper for the template — Angular's strict templates don't let us
   * call `tag.children.length > 0` in inline expressions without complaint
   * when accessed through a Signal, so we surface a typed predicate here.
   */
  public hasChildren(tag: ITagTree): boolean {
    return tag.children.length > 0;
  }

  public canEdit(tag: ITag): boolean {
    return !tag.system;
  }

  public canDelete(tag: ITag): boolean {
    return !tag.system;
  }

  private showSnackbar(message: string): void {
    this.snackBar.openFromComponent(NotificationComponent, {
      duration: 2000,
      data: { message },
      panelClass: 'custom-snackbar',
    });
  }
}
