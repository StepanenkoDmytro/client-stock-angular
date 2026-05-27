import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Category } from '../../../../domain/category.domain';
import { PageHeaderComponent } from '../../../../core/UI/components/page-header/page-header.component';
import { SpendingsService } from '../../../../service/spendings.service';
import { CategiriesSyncService } from '../../service/categiries-sync.service';
import {
  categoriesSpendindSelector,
  spendingsHistorySelector,
} from '../../store/spendings.selectors';
import { ISpendingsState } from '../../store/spendings.reducer';
import { selectPortfolioID } from '../../../../store/user.selectors';
import { Spending } from '../../model/Spending';
import { editSpending, deleteCategory as deleteCategoryAction } from '../../store/spendings.actions';
import { clearLastImport, readLastImport } from '../../../profile/components/import-spendings/spending-import.service';
import { MoveCategorySheetComponent, MoveCategorySheetData, MoveCategorySheetResult } from './move-category-sheet/move-category-sheet.component';
import { EditCategorySheetComponent, EditCategorySheetData, EditCategorySheetResult } from './edit-category-sheet/edit-category-sheet.component';

/**
 * Flattened row used by the template — each row knows its visual depth so
 * we can indent children without a recursive component.
 */
interface CategoryRow {
  category: Category;
  /** Depth under root (0 = direct child of Income/Spending). */
  depth: number;
  /** Same-root path as label hint, e.g. "Spending / Food". */
  ancestorsPath: string;
  /** Whether this category was created by the last import (NEW badge). */
  isNew: boolean;
}

interface RootGroup {
  root: Category;
  rows: CategoryRow[];
}

@Component({
  selector: 'pgz-organize-categories',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './organize-categories.component.html',
  styleUrl: './organize-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizeCategoriesComponent implements OnInit, OnDestroy {
  public groups: RootGroup[] = [];

  /** Multi-select state. Empty set = single-item mode. */
  public selectMode: boolean = false;
  public selectedIds = new Set<string>();

  private categories: Category[] = [];
  private newCategoryIds = new Set<string>();
  private readonly destroy$ = new Subject<void>();

  private readonly store = inject(Store<ISpendingsState>);
  private readonly spendingsService = inject(SpendingsService);
  private readonly categoriesSync = inject(CategiriesSyncService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  public ngOnInit(): void {
    const snapshot = readLastImport();
    this.newCategoryIds = new Set(snapshot?.categoryIds ?? []);

    this.store.select(categoriesSpendindSelector)
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
        this.groups = this.buildGroups(categories);
        this.cdr.markForCheck();
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public prevRoute(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Clears the NEW marker — called from the header «Done» action and
   * implicitly when the user leaves via back nav (kept TTL'd in storage
   * so it auto-expires after an hour anyway).
   */
  public dismissBadges(): void {
    clearLastImport();
    this.newCategoryIds.clear();
    this.groups = this.buildGroups(this.categories);
    this.cdr.markForCheck();
  }

  // ---- Edit (rename + reparent in one sheet) -------------------------------

  /**
   * Single edit action — opens a sheet with name input + parent picker.
   * Works for any depth (incl. non-leaf categories) because the new
   * `editCategory` reducer/effect path is a single atomic upsert, not
   * the racy delete-then-add chain that the older Rename / Move
   * actions used to call into.
   */
  public async openEditSheet(row: CategoryRow): Promise<void> {
    const root = this.findRoot(row.category);
    if (!root) {
      return;
    }
    const data: EditCategorySheetData = {
      source: row.category,
      root,
      candidates: this.buildMoveCandidates(root, row.category),
      canMakeTopLevel: row.category.parent !== root.id,
    };
    const ref = this.bottomSheet.open<EditCategorySheetComponent, EditCategorySheetData, EditCategorySheetResult | 'cancel'>(
      EditCategorySheetComponent, { data },
    );
    const result = await firstValueFrom(ref.afterDismissed());
    if (!result || result === 'cancel') {
      return;
    }
    const newName = result.name;
    const newParentId = result.parent === 'root' ? root.id : result.parent.id;
    const noNameChange = newName === row.category.title;
    const noParentChange = newParentId === row.category.parent;
    if (noNameChange && noParentChange) {
      return;
    }
    // `isSaved: false` so the editCategory$ effect re-POSTs. The server
    // upserts (Portfolio.addCategory replaces by id), so the same row
    // is updated server-side — no delete needed, no race.
    const updated = new Category(
      newName,
      row.category.icon,
      row.category.children,
      false,
      row.category.id,
      newParentId,
      row.category.color,
      row.category.limit,
    );
    await this.spendingsService.editCategory(updated);

    if (!noNameChange && !noParentChange) {
      const targetLabel = result.parent === 'root' ? root.title : result.parent.title;
      this.snackBar.open(`Renamed to «${newName}» and moved into «${targetLabel}»`, undefined, { duration: 2200 });
    } else if (!noNameChange) {
      this.snackBar.open(`Renamed to «${newName}»`, undefined, { duration: 1800 });
    } else {
      const targetLabel = result.parent === 'root' ? root.title : result.parent.title;
      this.snackBar.open(`Moved into «${targetLabel}»`, undefined, { duration: 1800 });
    }
  }

  // ---- Merge ---------------------------------------------------------------

  /**
   * Merge `row.category` into a target via the server's atomic merge
   * endpoint (task §2.6). Confirms with the user first because this
   * re-points all spendings of the source and is essentially destructive.
   */
  public async mergeInto(row: CategoryRow): Promise<void> {
    const root = this.findRoot(row.category);
    if (!root) {
      return;
    }
    const data: MoveCategorySheetData = {
      source: row.category,
      root,
      candidates: this.buildMoveCandidates(root, row.category),
      canMakeTopLevel: false,
    };
    const ref = this.bottomSheet.open<MoveCategorySheetComponent, MoveCategorySheetData, MoveCategorySheetResult>(
      MoveCategorySheetComponent, { data, panelClass: 'pgz-merge-sheet' },
    );
    const result = await firstValueFrom(ref.afterDismissed());
    if (!result || result === 'cancel' || result === 'root') {
      return;
    }
    const target = result;

    const affectedSpendings = await this.findSpendingsByCategoryId(row.category.id);
    const confirmMsg = `Merge «${row.category.title}» into «${target.title}»?` +
      (affectedSpendings.length > 0 ? ` ${affectedSpendings.length} spendings will be re-pointed.` : '');
    if (!confirm(confirmMsg)) {
      return;
    }

    const portfolioID = await firstValueFrom(this.store.select(selectPortfolioID));
    if (portfolioID == null) {
      return;
    }

    await firstValueFrom(this.categoriesSync.mergeCategoryOnServer(portfolioID, row.category.id, target.id));

    // Reflect the merge in local state without waiting for a full sync:
    // re-point affected spendings, re-parent direct children, drop source.
    for (const spending of affectedSpendings) {
      const repointed = new Spending(
        true,
        target,
        spending.comment,
        spending.cost,
        spending.date,
        spending.id,
        spending.currency,
      );
      this.store.dispatch(editSpending({ spending: repointed }));
    }
    for (const child of row.category.children) {
      const reparented = new Category(
        child.title,
        child.icon,
        child.children,
        true,
        child.id,
        target.id,
        child.color,
        child.limit,
      );
      this.spendingsService.addCategory(reparented);
    }
    this.store.dispatch(deleteCategoryAction({ category: row.category }));
    this.snackBar.open(`Merged into «${target.title}»`, undefined, { duration: 2000 });
  }

  private async findSpendingsByCategoryId(categoryId: string): Promise<Spending[]> {
    const all = await firstValueFrom(this.store.select(spendingsHistorySelector));
    return all.filter(s => s.category && s.category.id === categoryId);
  }

  // ---- Bulk select --------------------------------------------------------

  public toggleSelectMode(): void {
    this.selectMode = !this.selectMode;
    if (!this.selectMode) {
      this.selectedIds.clear();
    }
  }

  public isSelected(categoryId: string): boolean {
    return this.selectedIds.has(categoryId);
  }

  public toggleSelect(row: CategoryRow): void {
    if (this.selectedIds.has(row.category.id)) {
      this.selectedIds.delete(row.category.id);
    } else {
      this.selectedIds.add(row.category.id);
    }
    // Trigger CD — Set mutation isn't tracked by OnPush otherwise.
    this.selectedIds = new Set(this.selectedIds);
    this.cdr.markForCheck();
  }

  /**
   * Bulk merge — pick one target, then merge every selected category
   * into it server-side. Skips invalid pairs (self, descendants of self).
   */
  public async bulkMerge(): Promise<void> {
    const selectedRows = this.findSelectedRows();
    if (selectedRows.length === 0) {
      return;
    }
    // For target candidates, build from the FIRST selected row's root.
    // If selection spans roots, that's a user error — we surface a
    // gentle message and bail.
    const firstRoot = this.findRoot(selectedRows[0].category);
    if (!firstRoot) {
      return;
    }
    const mixedRoot = selectedRows.some(r => this.findRoot(r.category)?.id !== firstRoot.id);
    if (mixedRoot) {
      this.snackBar.open(
        'Pick categories from one root only (Income or Spending).',
        undefined,
        { duration: 2800 },
      );
      return;
    }
    // Candidates exclude every selected category + their descendants.
    const forbidden = new Set<string>();
    for (const row of selectedRows) {
      this.collectDescendantIds(row.category, forbidden);
      forbidden.add(row.category.id);
    }
    const candidates: MoveCategorySheetData['candidates'] = [];
    const walk = (node: Category, depth: number, ancestorTitles: string[]) => {
      for (const child of node.children) {
        if (forbidden.has(child.id)) {
          continue;
        }
        candidates.push({
          category: child,
          depth,
          ancestorsPath: ancestorTitles.join(' / '),
        });
        walk(child, depth + 1, [...ancestorTitles, child.title]);
      }
    };
    walk(firstRoot, 0, [firstRoot.title]);

    const data: MoveCategorySheetData = {
      source: selectedRows[0].category,
      root: firstRoot,
      candidates,
      canMakeTopLevel: false,
    };
    const ref = this.bottomSheet.open<MoveCategorySheetComponent, MoveCategorySheetData, MoveCategorySheetResult>(
      MoveCategorySheetComponent, { data },
    );
    const result = await firstValueFrom(ref.afterDismissed());
    if (!result || result === 'cancel' || result === 'root') {
      return;
    }
    const target = result;
    if (!confirm(`Merge ${selectedRows.length} categories into «${target.title}»? Spendings will be re-pointed.`)) {
      return;
    }
    const portfolioID = await firstValueFrom(this.store.select(selectPortfolioID));
    if (portfolioID == null) {
      return;
    }
    for (const row of selectedRows) {
      const affected = await this.findSpendingsByCategoryId(row.category.id);
      await firstValueFrom(this.categoriesSync.mergeCategoryOnServer(portfolioID, row.category.id, target.id));
      for (const spending of affected) {
        const repointed = new Spending(true, target, spending.comment, spending.cost, spending.date, spending.id, spending.currency);
        this.store.dispatch(editSpending({ spending: repointed }));
      }
      for (const child of row.category.children) {
        const reparented = new Category(
          child.title, child.icon, child.children, true, child.id, target.id, child.color, child.limit,
        );
        this.spendingsService.addCategory(reparented);
      }
      this.store.dispatch(deleteCategoryAction({ category: row.category }));
    }
    this.snackBar.open(`Merged ${selectedRows.length} categories into «${target.title}»`, undefined, { duration: 2200 });
    this.selectedIds.clear();
    this.selectMode = false;
  }

  /**
   * Bulk move — pick one target parent (or top-level), then re-parent
   * every selected LEAF category. Non-leaves are skipped with a notice.
   */
  public async bulkMove(): Promise<void> {
    const selectedRows = this.findSelectedRows();
    if (selectedRows.length === 0) {
      return;
    }
    const leafRows = selectedRows.filter(r => r.category.children.length === 0);
    const nonLeafCount = selectedRows.length - leafRows.length;
    if (leafRows.length === 0) {
      this.snackBar.open(
        'Bulk move works on leaf categories only. Use Merge for the rest.',
        undefined,
        { duration: 2800 },
      );
      return;
    }
    const firstRoot = this.findRoot(leafRows[0].category);
    if (!firstRoot) {
      return;
    }
    const mixedRoot = leafRows.some(r => this.findRoot(r.category)?.id !== firstRoot.id);
    if (mixedRoot) {
      this.snackBar.open(
        'Pick leaves from one root only (Income or Spending).',
        undefined,
        { duration: 2800 },
      );
      return;
    }
    const forbidden = new Set(leafRows.map(r => r.category.id));
    const candidates: MoveCategorySheetData['candidates'] = [];
    const walk = (node: Category, depth: number, ancestorTitles: string[]) => {
      for (const child of node.children) {
        if (forbidden.has(child.id)) {
          continue;
        }
        candidates.push({
          category: child,
          depth,
          ancestorsPath: ancestorTitles.join(' / '),
        });
        walk(child, depth + 1, [...ancestorTitles, child.title]);
      }
    };
    walk(firstRoot, 0, [firstRoot.title]);

    const data: MoveCategorySheetData = {
      source: leafRows[0].category,
      root: firstRoot,
      candidates,
      canMakeTopLevel: true,
    };
    const ref = this.bottomSheet.open<MoveCategorySheetComponent, MoveCategorySheetData, MoveCategorySheetResult>(
      MoveCategorySheetComponent, { data },
    );
    const result = await firstValueFrom(ref.afterDismissed());
    if (!result || result === 'cancel') {
      return;
    }
    const newParentId = result === 'root' ? firstRoot.id : result.id;
    for (const row of leafRows) {
      if (newParentId === row.category.parent) {
        continue;
      }
      const updated = new Category(
        row.category.title, row.category.icon, row.category.children, false,
        row.category.id, newParentId, row.category.color, row.category.limit,
      );
      await this.spendingsService.editCategory(updated);
    }
    const targetLabel = result === 'root' ? firstRoot.title : result.title;
    const tail = nonLeafCount > 0 ? ` · ${nonLeafCount} non-leaf skipped` : '';
    this.snackBar.open(`Moved ${leafRows.length} leaves into «${targetLabel}»${tail}`, undefined, { duration: 2200 });
    this.selectedIds.clear();
    this.selectMode = false;
  }

  private findSelectedRows(): CategoryRow[] {
    const allRows = this.groups.flatMap(g => g.rows);
    return allRows.filter(r => this.selectedIds.has(r.category.id));
  }

  // ---- Internals -----------------------------------------------------------

  private buildGroups(roots: Category[]): RootGroup[] {
    return roots
      .filter(c => c.isRoot)
      .map(root => ({
        root,
        rows: this.flattenWithDepth(root, 0, [root.title]),
      }));
  }

  /**
   * DFS flatten — produces rows in DOM order (parent then descendants)
   * with depth for indenting. Skips the root itself (it's the section
   * header, not a row).
   */
  private flattenWithDepth(node: Category, depth: number, ancestorTitles: string[]): CategoryRow[] {
    const rows: CategoryRow[] = [];
    for (const child of node.children) {
      const path = [...ancestorTitles, child.title].join(' / ');
      rows.push({
        category: child,
        depth,
        ancestorsPath: ancestorTitles.join(' / '),
        isNew: this.newCategoryIds.has(child.id),
      });
      if (child.children.length > 0) {
        rows.push(...this.flattenWithDepth(child, depth + 1, [...ancestorTitles, child.title]));
      }
    }
    return rows;
  }

  /** Walks up from a category to its root via parent ids. */
  private findRoot(category: Category): Category | undefined {
    let current: Category | undefined = category;
    while (current && current.parent) {
      current = Category.findCategoryById(current.parent, this.categories);
    }
    return current;
  }

  /**
   * Builds the list of valid move targets within the source's root —
   * excludes the source itself and all of its descendants (cycle guard).
   */
  private buildMoveCandidates(root: Category, source: Category): MoveCategorySheetData['candidates'] {
    const forbidden = new Set<string>();
    this.collectDescendantIds(source, forbidden);
    forbidden.add(source.id);

    const candidates: MoveCategorySheetData['candidates'] = [];
    const walk = (node: Category, depth: number, ancestorTitles: string[]) => {
      for (const child of node.children) {
        if (forbidden.has(child.id)) {
          continue;
        }
        candidates.push({
          category: child,
          depth,
          ancestorsPath: ancestorTitles.join(' / '),
        });
        walk(child, depth + 1, [...ancestorTitles, child.title]);
      }
    };
    walk(root, 0, [root.title]);
    return candidates;
  }

  private collectDescendantIds(node: Category, out: Set<string>): void {
    for (const child of node.children) {
      out.add(child.id);
      this.collectDescendantIds(child, out);
    }
  }
}
