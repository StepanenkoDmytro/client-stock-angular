import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Store } from '@ngrx/store';
import { environment } from '../../../../../environments/environment';
import { Category } from '../../../../domain/category.domain';
import { colorPalette } from '../../../../domain/d3.domain';
import { Spending } from '../../../spending/model/Spending';
import { CategiriesSyncService } from '../../../spending/service/categiries-sync.service';
import { SpendingsSyncService } from '../../../spending/service/spendings-sync.service';
import { categoriesSpendindSelector } from '../../../spending/store/spendings.selectors';
import { ISpendingsState } from '../../../spending/store/spendings.reducer';
import { addCategory, addMultipleSpendings } from '../../../spending/store/spendings.actions';

/** Per task §2.3, hard cap on rows per file. */
export const IMPORT_ROW_LIMIT = 1000;

/** Per task §2.3, soft cap on amount. */
export const IMPORT_AMOUNT_WARN = 10_000_000;

/** Per task §2.3, hard cap on comment length. */
export const IMPORT_COMMENT_MAX = 200;

/** Path separators accepted in the Category column (per task §2.5 v2). */
const PATH_SEPARATOR = /\s*>\s*|\s+→\s+|\s+\/\s+/;

export interface RawRow {
  /** 1-based row number in the source file (for error messages). */
  rowNum: number;
  date: string;
  type: string;
  category: string;
  amount: string;
  comment: string;
}

export interface InvalidRow {
  rowNum: number;
  reason: string;
}

export interface ValidRow {
  rowNum: number;
  date: Date;
  type: 'Income' | 'Expense';
  /** Resolved or newly-created category for this row. */
  category: Category;
  amount: number;
  comment: string;
}

export interface ImportPlan {
  valid: ValidRow[];
  invalid: InvalidRow[];
  /** Categories that will be POSTed as new (with parent ids set). */
  newCategories: Category[];
  /** Categories that already existed and were reused (for transparency). */
  reusedCategories: Category[];
}

export interface ImportResult {
  importedSpendings: number;
  createdCategories: number;
}

/**
 * localStorage key tracking the most recent import for the «NEW» badge
 * in Organize Categories (§2.6). Cleared when the user opens Organize
 * via the post-import toast CTA. Falls back to a 1-hour TTL so stale
 * flags don't leak across sessions.
 */
export const LAST_IMPORT_KEY = 'pgz-last-import-batch';
const LAST_IMPORT_TTL_MS = 60 * 60 * 1000;

export interface LastImportSnapshot {
  timestamp: number;
  categoryIds: string[];
}

export function readLastImport(): LastImportSnapshot | null {
  try {
    const raw = localStorage.getItem(LAST_IMPORT_KEY);
    if (!raw) {
      return null;
    }
    const parsed: LastImportSnapshot = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > LAST_IMPORT_TTL_MS) {
      localStorage.removeItem(LAST_IMPORT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastImport(): void {
  localStorage.removeItem(LAST_IMPORT_KEY);
}

/**
 * Validation result shape. `strictNullChecks` is off in this project's
 * tsconfig (intentional codebase-wide choice), so discriminated unions
 * don't narrow correctly — flat shape with optional fields and an `ok`
 * boolean is the only ergonomic option.
 */
interface ValidationResult {
  ok: boolean;
  reason?: string;
  date?: Date;
  type?: 'Income' | 'Expense';
  amount?: number;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class SpendingImportService {
  private readonly store = inject(Store<ISpendingsState>);
  private readonly spendingsSync = inject(SpendingsSyncService);
  private readonly categoriesSync = inject(CategiriesSyncService);
  private readonly http = inject(HttpClient);

  /**
   * Parse any supported spreadsheet — .csv, .xlsx, .xls. Dispatches to
   * the native CSV reader for text formats and to SheetJS for binary
   * Excel formats. Returns header-stripped raw rows in source order.
   *
   * SheetJS is loaded lazily so the main bundle doesn't pay the ~600KB
   * cost until the user actually opens the import sheet (Angular code-
   * splits dynamic imports automatically).
   */
  public async parseFile(file: File): Promise<RawRow[]> {
    const ext = this.fileExtension(file.name);
    if (ext === 'csv' || (!ext && file.type === 'text/csv')) {
      return this.parseCsvText(await this.readAsText(file));
    }
    return this.parseSpreadsheet(file);
  }

  /** Back-compat alias — the import component previously called parseCSV. */
  public parseCSV(file: File): Promise<RawRow[]> {
    return this.parseFile(file);
  }

  /**
   * Fetch a public Google Sheets URL via the server proxy and parse it
   * as CSV. The server side handles SSRF guard + Google CORS bypass +
   * size-cap; we just receive the CSV body or a 4xx with a message.
   */
  public async parseGSheetUrl(portfolioID: number | null, shareUrl: string): Promise<RawRow[]> {
    // The server uses `portfolioID` only as a path-shape placeholder
    // (the gsheet-fetch handler doesn't read it). Default to 0 for
    // anonymous users so the request still goes through and we can
    // show the preview before persisting.
    const safePortfolioID = portfolioID ?? 0;
    const proxyUrl = `${environment.apiBaseUrl}/profile/${safePortfolioID}/gsheet-fetch?url=${encodeURIComponent(shareUrl)}`;
    try {
      const csv = await firstValueFrom(
        this.http.get(proxyUrl, { responseType: 'text' }),
      );
      return this.parseCsvText(csv);
    } catch (e: any) {
      const err = e as HttpErrorResponse;
      // Server returns plain-text bodies with human-readable reasons
      // («Make the sheet public first», «Sheet not found», etc).
      const message = typeof err?.error === 'string' && err.error
        ? err.error
        : err?.message || 'Could not fetch the Google Sheet';
      throw new Error(message);
    }
  }

  private parseCsvText(text: string): RawRow[] {
    const lines = this.splitLines(text);
    if (lines.length < 2) {
      return [];
    }
    const rows: RawRow[] = [];
    // Skip the header row (line 0).
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }
      const cells = this.parseCsvLine(line);
      rows.push({
        rowNum: i + 1,
        date: (cells[0] || '').trim(),
        type: (cells[1] || '').trim(),
        category: (cells[2] || '').trim(),
        amount: (cells[3] || '').trim(),
        comment: (cells[4] || '').trim(),
      });
    }
    return rows;
  }

  /**
   * Parse an .xlsx / .xls binary via SheetJS. The first sheet is taken
   * (matches the template's «Transactions» tab). Date cells come back
   * as JS Date objects; we ISO-stringify them so the existing date
   * validator handles them uniformly.
   */
  private async parseSpreadsheet(file: File): Promise<RawRow[]> {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return [];
    }
    const sheet = wb.Sheets[sheetName];
    const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: '',
    });
    if (matrix.length < 2) {
      return [];
    }
    const rows: RawRow[] = [];
    for (let i = 1; i < matrix.length; i++) {
      const cells = matrix[i] || [];
      const all = cells.map(c => (c == null ? '' : String(c).trim()));
      // Skip fully-empty rows so trailing blanks in Excel don't pollute.
      if (all.every(c => !c)) {
        continue;
      }
      rows.push({
        rowNum: i + 1,
        date: this.normalizeExcelDate(cells[0]),
        type: all[1] || '',
        category: all[2] || '',
        amount: all[3] || '',
        comment: all[4] || '',
      });
    }
    return rows;
  }

  private normalizeExcelDate(cell: any): string {
    if (cell == null || cell === '') {
      return '';
    }
    if (cell instanceof Date) {
      // YYYY-MM-DD, UTC-normalised — matches the CSV template format.
      const yyyy = cell.getUTCFullYear();
      const mm = String(cell.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(cell.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return String(cell).trim();
  }

  private fileExtension(name: string): string {
    const idx = name.lastIndexOf('.');
    return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
  }

  /**
   * Build an import plan from raw rows. Runs validation (§2.3) and the
   * traverse-or-create category resolver (§2.5 v2). No I/O — pure
   * computation on a snapshot of the current category tree.
   *
   * @param rows parsed CSV rows
   * @param allCategories current category tree (incl. defaults). MUTATED:
   *   newly-created categories are pushed into their parent's `children`
   *   so subsequent rows reuse them.
   */
  public buildPlan(rows: RawRow[], allCategories: Category[]): ImportPlan {
    const plan: ImportPlan = { valid: [], invalid: [], newCategories: [], reusedCategories: [] };
    const reusedIds = new Set<string>();

    if (rows.length > IMPORT_ROW_LIMIT) {
      // The UI also gates this, but a defensive truncate keeps the rest
      // of the pipeline single-shape.
      plan.invalid.push({
        rowNum: 0,
        reason: `File has ${rows.length} rows (max ${IMPORT_ROW_LIMIT}). Split into smaller files.`,
      });
      return plan;
    }

    // Clone the tree so re-runs (user picks a different file) start clean
    // and the live store-held tree never accumulates ghost categories.
    const workingTree = this.cloneTree(allCategories);

    for (const row of rows) {
      const validation = this.validateRow(row);
      if (!validation.ok) {
        plan.invalid.push({ rowNum: row.rowNum, reason: validation.reason });
        continue;
      }

      const root = this.findRoot(workingTree, validation.type);
      if (!root) {
        plan.invalid.push({
          rowNum: row.rowNum,
          reason: `No "${validation.type === 'Income' ? 'Income' : 'Spending'}" root category in the system`,
        });
        continue;
      }

      const resolved = this.resolveOrCreatePath(root, row.category, plan.newCategories);
      if (!resolved.isSaved && !reusedIds.has(resolved.id)) {
        // newly-created and tracked in `plan.newCategories` already
      } else if (resolved.isSaved && !reusedIds.has(resolved.id)) {
        plan.reusedCategories.push(resolved);
        reusedIds.add(resolved.id);
      }

      plan.valid.push({
        rowNum: row.rowNum,
        date: validation.date!,
        type: validation.type!,
        category: resolved,
        amount: validation.amount!,
        comment: validation.comment!,
      });
    }
    return plan;
  }

  /**
   * Persist the plan: categories first (so spending FKs resolve), then
   * spendings. Both via batch endpoints. Returns the realised counts.
   *
   * Categories and spendings are independently catch-er'd in the sync
   * services; if either batch fails the user sees the global error
   * snackbar and the state remains consistent (server is atomic per
   * transaction, store reflects only what came back).
   */
  public async executePlan(plan: ImportPlan, portfolioID: number | null): Promise<ImportResult> {
    // Topological sort — after the user reparents a new category in the
    // preview (e.g. makes «Cat» a child of another new category «Pets»),
    // the original parent-before-child order from §2.5 v2 may no longer
    // hold. Both the server's `Portfolio.addCategory` and the client
    // reducer's `addCategoryToParent` require the parent to exist before
    // the child arrives, so we re-sort here defensively.
    plan.newCategories = this.topologicalSortByParent(plan.newCategories);

    // Two paths:
    //  · Authed user with a portfolio → server-side batch POSTs (atomic
    //    on the JPA side, frontend store updated via the syncs' `tap`).
    //  · Anonymous user (no portfolioID) → dispatch local-only actions.
    //    The reducer adds them to NgRx state and the existing
    //    SpendingsService.init subscription persists to localStorage.
    //    Effects already filter on authToken, so nothing leaks to the
    //    server in this mode.
    const isAuthed = portfolioID !== null && portfolioID !== undefined;

    let createdCategories = 0;
    if (plan.newCategories.length > 0) {
      if (isAuthed) {
        const savedCategories = await firstValueFrom(
          this.categoriesSync.sendCategoriesBatchToServer(portfolioID, plan.newCategories),
        ).catch(() => [] as Category[]);
        createdCategories = savedCategories.length;
      } else {
        for (const category of plan.newCategories) {
          this.store.dispatch(addCategory({ category }));
        }
        createdCategories = plan.newCategories.length;
      }
    }

    let importedSpendings = 0;
    if (plan.valid.length > 0) {
      // `cost` is stored unsigned everywhere in this codebase
      // (add-spending.component.ts line 145). Income vs Expense is inferred
      // from the category's root at aggregation time, not from sign.
      const spendingsToPost = plan.valid.map(v => new Spending(
        false,
        v.category,
        v.comment,
        v.amount,
        v.date,
      ));
      if (isAuthed) {
        const categoriesSnapshot = await firstValueFrom(this.store.select(categoriesSpendindSelector));
        const savedSpendings = await firstValueFrom(
          this.spendingsSync.sendSpendingsBatchToServer(portfolioID, spendingsToPost, categoriesSnapshot),
        ).catch(() => [] as Spending[]);
        importedSpendings = savedSpendings.length;
      } else {
        this.store.dispatch(addMultipleSpendings({ spendings: spendingsToPost }));
        importedSpendings = spendingsToPost.length;
      }
    }

    // Persist the NEW-badge marker so Organize Categories can highlight
    // the freshly-imported categories. We use the originally-generated
    // ids from `plan.newCategories` — the server preserves ids on save.
    if (plan.newCategories.length > 0) {
      const snapshot: LastImportSnapshot = {
        timestamp: Date.now(),
        categoryIds: plan.newCategories.map(c => c.id),
      };
      try {
        localStorage.setItem(LAST_IMPORT_KEY, JSON.stringify(snapshot));
      } catch {
        // localStorage quota / disabled — NEW badge gracefully degrades.
      }
    }

    return { importedSpendings, createdCategories };
  }

  // ---- Internals ----------------------------------------------------------

  private readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      // Strip BOM after read; FileReader 'UTF-8' doesn't always.
      reader.readAsText(file, 'UTF-8');
    }).then(text => {
      const t = text as string;
      return t.charCodeAt(0) === 0xFEFF ? t.slice(1) : t;
    });
  }

  private splitLines(text: string): string[] {
    return text.split(/\r\n|\r|\n/);
  }

  /**
   * Minimal RFC-4180 CSV line parser. Handles quoted fields with embedded
   * commas, newlines (we already split, so quoted newlines won't survive
   * — acceptable for spending templates where Comment is single-line),
   * and `""` as an escaped quote.
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else {
        if (ch === ',') {
          result.push(cur);
          cur = '';
        } else if (ch === '"' && cur === '') {
          inQuotes = true;
        } else {
          cur += ch;
        }
      }
    }
    result.push(cur);
    return result;
  }

  private validateRow(row: RawRow): ValidationResult {
    const date = this.parseDate(row.date);
    if (!date) {
      return { ok: false, reason: `Invalid Date «${row.date}»` };
    }
    const today = new Date();
    const thirtyDaysAhead = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (date.getTime() > thirtyDaysAhead.getTime()) {
      // Soft warning per §2.3 — for MVP, treat as invalid so the user
      // notices. Promotion to warning-with-override lives in PR2 polish.
      return { ok: false, reason: `Date «${row.date}» is more than 30 days in the future` };
    }

    const typeNorm = row.type.toLowerCase();
    let type: 'Income' | 'Expense';
    if (typeNorm === 'income') {
      type = 'Income';
    } else if (typeNorm === 'expense') {
      type = 'Expense';
    } else {
      return { ok: false, reason: `Invalid Type «${row.type}» (expected Income or Expense)` };
    }

    if (!row.category) {
      return { ok: false, reason: 'Missing Category' };
    }

    const amount = Number(row.amount.replace(/\s|_/g, '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, reason: `Invalid Amount «${row.amount}»` };
    }

    let comment = row.comment;
    if (comment.length > IMPORT_COMMENT_MAX) {
      comment = comment.slice(0, IMPORT_COMMENT_MAX);
    }

    return { ok: true, date, type, amount, comment };
  }

  private parseDate(raw: string): Date | null {
    if (!raw) {
      return null;
    }
    // ISO YYYY-MM-DD first — most common from our template.
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (iso) {
      const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
      return isNaN(d.getTime()) ? null : d;
    }
    // DD/MM/YYYY fallback per §2.3.
    const dmy = /^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/.exec(raw);
    if (dmy) {
      const d = new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]));
      return isNaN(d.getTime()) ? null : d;
    }
    // Generic Date parse last resort (handles Excel-native strings if the
    // file was exported with locale formatting).
    const generic = new Date(raw);
    return isNaN(generic.getTime()) ? null : generic;
  }

  private findRoot(categories: Category[], type: 'Income' | 'Expense'): Category | undefined {
    const wanted = type === 'Income' ? 'income' : 'spending';
    return categories.find(c => c.isRoot && c.title.toLowerCase() === wanted);
  }

  /**
   * Walk the category tree from `root` following `pathRaw` segments;
   * create missing levels as we go (per §2.5 v2). The mutated `root`
   * tree means subsequent rows that reference the same path reuse the
   * newly-created nodes — keep `newCategoriesAccumulator` in sync so the
   * batch POST sees them.
   */
  private resolveOrCreatePath(root: Category, pathRaw: string, newCategoriesAccumulator: Category[]): Category {
    const segments = pathRaw.split(PATH_SEPARATOR).map(s => s.trim()).filter(s => s.length > 0);
    if (segments.length === 0) {
      return root;
    }
    let current = root;
    for (const segment of segments) {
      const segLower = segment.toLowerCase();
      const match = current.children.find(c => c.title.toLowerCase() === segLower);
      if (match) {
        current = match;
        continue;
      }
      const newCat = new Category(segment, 'icon_group', [], false, null, current.id);
      newCat.setColor(this.pickFreeColor(current.children));
      current.children.push(newCat);
      newCategoriesAccumulator.push(newCat);
      current = newCat;
    }
    return current;
  }

  private pickFreeColor(siblings: Category[]): string | null {
    const occupied = new Set(siblings.map(c => c.color).filter(c => !!c));
    const free = colorPalette.find(c => !occupied.has(c));
    return free ?? null;
  }

  /**
   * Stable depth-first sort: parents before children. Anything whose
   * parent isn't in the list (e.g. references an existing root or
   * existing category from the live tree) goes first; chains within
   * the new set follow in dependency order. Tolerates accidental
   * cycles by visiting each id at most once.
   */
  private topologicalSortByParent(categories: Category[]): Category[] {
    const byId = new Map<string, Category>();
    for (const c of categories) {
      byId.set(c.id, c);
    }
    const visited = new Set<string>();
    const sorted: Category[] = [];
    const visit = (cat: Category) => {
      if (visited.has(cat.id)) {
        return;
      }
      visited.add(cat.id);
      if (cat.parent && byId.has(cat.parent)) {
        visit(byId.get(cat.parent)!);
      }
      sorted.push(cat);
    };
    for (const c of categories) {
      visit(c);
    }
    return sorted;
  }

  /** Deep clone the category tree so resolver mutations stay local. */
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
}
