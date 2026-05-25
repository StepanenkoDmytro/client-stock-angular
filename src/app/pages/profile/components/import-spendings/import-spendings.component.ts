import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { PageHeaderComponent } from '../../../../core/UI/components/page-header/page-header.component';
import { Category } from '../../../../domain/category.domain';
import { categoriesSpendindSelector } from '../../../spending/store/spendings.selectors';
import { selectPortfolioID } from '../../../../store/user.selectors';
import { ISpendingsState } from '../../../spending/store/spendings.reducer';
import { ImportPlan, SpendingImportService } from './spending-import.service';
import {
  EditCategorySheetComponent,
  EditCategorySheetData,
  EditCategorySheetResult,
} from '../../../spending/components/organize-categories/edit-category-sheet/edit-category-sheet.component';

type Stage = 'instructions' | 'review' | 'importing' | 'done';

@Component({
  selector: 'pgz-import-spendings',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './import-spendings.component.html',
  styleUrl: './import-spendings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportSpendingsComponent implements OnInit {
  public stage: Stage = 'instructions';
  public fileName: string = '';
  public plan: ImportPlan | null = null;
  public errorMessage: string = '';
  public importedSpendings: number = 0;
  public createdCategories: number = 0;

  /** Bound to the «Import from Google Sheets URL» input. */
  public gsheetUrlInput: string = '';
  public fetchingFromUrl: boolean = false;

  public readonly templateHref = '/assets/templates/spending-import-template.csv';
  public readonly gsheetUrl: string = environment.importTemplateGsheetUrl || '';

  private categories: Category[] = [];
  private portfolioID: number | null = null;

  private readonly importService = inject(SpendingImportService);
  private readonly store = inject(Store<ISpendingsState>);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly bottomSheet = inject(MatBottomSheet);

  public async ngOnInit(): Promise<void> {
    this.categories = await firstValueFrom(this.store.select(categoriesSpendindSelector));
    this.portfolioID = await firstValueFrom(this.store.select(selectPortfolioID));
  }

  public async onFilePicked(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.fileName = file.name;
    this.errorMessage = '';
    try {
      const rows = await this.importService.parseCSV(file);
      if (rows.length === 0) {
        this.errorMessage = 'The file appears to be empty or has no data rows.';
        this.cdr.markForCheck();
        return;
      }
      this.plan = this.importService.buildPlan(rows, this.categories);
      this.stage = 'review';
    } catch (e: any) {
      this.errorMessage = `Could not read the file: ${e?.message || 'unknown error'}`;
    } finally {
      // Allow the same file to be re-picked.
      input.value = '';
      this.cdr.markForCheck();
    }
  }

  public async importFromUrl(): Promise<void> {
    const url = this.gsheetUrlInput.trim();
    if (!url) {
      return;
    }
    this.fetchingFromUrl = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    try {
      // portfolioID may be null for anonymous users — the server proxy
      // ignores that segment, so we pass through and let executePlan
      // decide later how to persist.
      const rows = await this.importService.parseGSheetUrl(this.portfolioID, url);
      if (rows.length === 0) {
        this.errorMessage = 'The sheet has no data rows.';
        return;
      }
      this.fileName = 'Google Sheets';
      this.plan = this.importService.buildPlan(rows, this.categories);
      this.stage = 'review';
    } catch (e: any) {
      this.errorMessage = e?.message || 'Could not import from that URL.';
    } finally {
      this.fetchingFromUrl = false;
      this.cdr.markForCheck();
    }
  }

  public async confirmImport(): Promise<void> {
    if (!this.plan) {
      return;
    }
    this.stage = 'importing';
    this.cdr.markForCheck();
    // portfolioID may be null for anonymous users — executePlan handles
    // that by skipping the batch POSTs and dispatching local-only
    // actions, which is consistent with how the rest of the spendings
    // pipeline handles anonymous mode (effects filter on authToken).
    const result = await this.importService.executePlan(this.plan, this.portfolioID);
    this.importedSpendings = result.importedSpendings;
    this.createdCategories = result.createdCategories;
    this.stage = 'done';
    this.cdr.markForCheck();
  }

  public backToInstructions(): void {
    this.plan = null;
    this.fileName = '';
    this.errorMessage = '';
    this.stage = 'instructions';
  }

  public goToSpending(): void {
    this.router.navigate(['/spending']);
  }

  public goToOrganize(): void {
    this.router.navigate(['/spending/organize-categories']);
  }

  public prevRoute(): void {
    if (this.stage === 'review') {
      this.backToInstructions();
      return;
    }
    this.router.navigate(['/profile/export-import']);
  }

  /**
   * Tap a new-category chip in the review preview → open an Edit sheet so
   * the user can rename it AND pick a different parent BEFORE we persist
   * anything. The intent (per Дмитро 2026-05-25): «don't add spendings
   * until I've confirmed how the new categories are organised».
   *
   * Candidates include every existing category under the same root PLUS
   * the other categories from this same import plan — so the user can
   * nest a new category under another new one (e.g. make «Cat» a child
   * of «Pets», where Pets is also being created right now).
   */
  public async editPlanCategory(category: Category): Promise<void> {
    if (!this.plan) {
      return;
    }
    const root = this.findRootForPlanCategory(category);
    if (!root) {
      return;
    }
    const candidates = this.buildPlanCandidates(root, category);
    const data: EditCategorySheetData = {
      source: category,
      root,
      candidates,
      canMakeTopLevel: category.parent !== root.id,
    };
    const ref = this.bottomSheet.open<
      EditCategorySheetComponent,
      EditCategorySheetData,
      EditCategorySheetResult | 'cancel'
    >(EditCategorySheetComponent, { data });
    const result = await firstValueFrom(ref.afterDismissed());
    if (!result || result === 'cancel') {
      return;
    }
    // Mutate the Category object in place — `plan.newCategories` and
    // `plan.valid[*].category` both hold references to the same Category
    // instance, so this single mutation updates every spot that displays
    // it. (We re-sort the array topologically at commit time in case
    // the user reparented under another new category.)
    category.title = result.name;
    category.parent = result.parent === 'root' ? root.id : result.parent.id;
    this.cdr.markForCheck();
  }

  // --- internals for the preview-time editor -------------------------------

  /**
   * Walk parent ids upward through both the live category tree AND the
   * plan's new-categories list (which aren't in the store yet). Returns
   * the root (Income / Spending) the category eventually belongs to.
   */
  private findRootForPlanCategory(category: Category): Category | undefined {
    const newCatById = new Map<string, Category>();
    this.plan?.newCategories.forEach(c => newCatById.set(c.id, c));
    let current: Category | undefined = category;
    while (current && current.parent) {
      current = newCatById.get(current.parent)
        ?? Category.findCategoryById(current.parent, this.categories);
    }
    return current;
  }

  /**
   * Build the parent-picker list for an edit-in-preview action. Produces
   * a flat, depth-annotated walk of the same-root tree *augmented* with
   * the plan's new categories — so users can pick any in-progress new
   * category as the parent of another. Excludes `source` and its
   * descendants (cycle guard).
   */
  private buildPlanCandidates(root: Category, source: Category): EditCategorySheetData['candidates'] {
    // Clone the live tree so we don't mutate the store. Then splice every
    // new category into its parent's children list — using the original
    // references so edits made through the sheet still mutate the right
    // Category instances inside `plan.newCategories`.
    const clonedRoots = this.cloneTree(this.categories);
    const byId = new Map<string, Category>();
    const collect = (nodes: Category[]) => {
      for (const n of nodes) {
        byId.set(n.id, n);
        collect(n.children);
      }
    };
    collect(clonedRoots);
    if (this.plan) {
      for (const newCat of this.plan.newCategories) {
        if (byId.has(newCat.id)) {
          continue;
        }
        const parent = newCat.parent ? byId.get(newCat.parent) : null;
        if (parent) {
          parent.children.push(newCat);
          byId.set(newCat.id, newCat);
        }
      }
    }

    const clonedRoot = clonedRoots.find(c => c.id === root.id);
    if (!clonedRoot) {
      return [];
    }
    const forbidden = new Set<string>();
    forbidden.add(source.id);
    this.collectDescendantIds(source, forbidden);

    const out: EditCategorySheetData['candidates'] = [];
    const walk = (node: Category, depth: number, ancestorTitles: string[]) => {
      for (const child of node.children) {
        if (forbidden.has(child.id)) {
          continue;
        }
        out.push({ category: child, depth, ancestorsPath: ancestorTitles.join(' / ') });
        walk(child, depth + 1, [...ancestorTitles, child.title]);
      }
    };
    walk(clonedRoot, 0, [clonedRoot.title]);
    return out;
  }

  private cloneTree(roots: Category[]): Category[] {
    return roots.map(r => this.cloneNode(r));
  }

  private cloneNode(node: Category): Category {
    const clone = new Category(
      node.title,
      node.icon,
      [],
      node.isSaved,
      node.id,
      node.parent,
      node.color,
      node.limit,
    );
    clone.children = node.children.map(c => this.cloneNode(c));
    return clone;
  }

  private collectDescendantIds(node: Category, out: Set<string>): void {
    for (const child of node.children) {
      out.add(child.id);
      this.collectDescendantIds(child, out);
    }
  }

  /**
   * Display path for a category (e.g. "Spending / Food / Restaurants").
   * Resolves parent ids through both the live category tree and the
   * plan's newly-created nodes (which aren't in the store yet at preview
   * time).
   */
  public ancestorsPath(category: Category): string {
    const newMap = new Map<string, Category>();
    this.plan?.newCategories.forEach(c => newMap.set(c.id, c));

    const segments: string[] = [];
    let current: Category | undefined = category;
    while (current) {
      segments.unshift(current.title);
      if (!current.parent) {
        break;
      }
      current = newMap.get(current.parent)
        ?? Category.findCategoryById(current.parent, this.categories);
    }
    return segments.join(' / ');
  }
}
