/**
 * ITag — user-facing classification of a Holding per ADR-0007.
 *
 * System tags (`system: true`) are seeded on first launch from the canonical
 * set defined in the ADR (Investment {Long-term, Short-term, Speculative};
 * Income type {Fixed income, Dividend, Growth}; Purpose {Pension, Emergency,
 * Trading}). They cannot be edited or deleted from the UI.
 *
 * User tags (`system: false`) are arbitrary user-created classifications.
 * Hierarchy is expressed via optional `parentId`; the root level is
 * `parentId === undefined`.
 */
export interface ITag {
  id: string;
  name: string;
  parentId?: string;
  /** Hex color, e.g. '#908E91'. Used by tag chips and category swatches. */
  color: string;
  /** Optional icon id from the global IconRegistry (e.g. 'custom_calendar'). */
  icon?: string;
  system: boolean;
  /** ISO-8601 timestamp. */
  createdAt: string;
  /**
   * `true` for tags materialised by `DemoDataService.seed()`. Per task
   * §4.3, system tags are part of the demo bucket — they get seeded with
   * `isDemo: true` alongside demo holdings/accounts and disappear together
   * when the user clears the demo. User-created tags (`system: false`)
   * stay `isDemo: false` so `clear()` never touches them.
   * Per `docs/notes/2026-05-savings-empty-states-ladder.md` §4.3.
   */
  isDemo?: boolean;
}

/**
 * ITagTree — joined projection of ITag with its children resolved.
 * Built by selectors for drill-down rendering. Mutually recursive type.
 */
export interface ITagTree extends ITag {
  children: ITagTree[];
}
