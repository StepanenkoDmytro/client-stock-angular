import { v4 as uuid } from 'uuid';
import { ITag } from '../../../domain/tag.domain';

/**
 * System tag definitions per ADR-0007 §«Системні дефолти».
 *
 * Three root categories, each with three children:
 *
 *   Investment    → Long-term / Short-term / Speculative
 *   Income type   → Fixed income / Dividend / Growth
 *   Purpose       → Pension / Emergency / Trading
 *
 * These are seeded into the tags store on first launch (when no `'tags-list'`
 * key exists in localStorage). Each invocation of `createSystemTags()`
 * produces fresh UUIDs, so the seeded IDs are stable post-bootstrap (lives
 * in localStorage) but differ across devices/browsers until backend sync
 * (M5) replaces them with canonical UUID constants from the backend
 * (ADR-0007 §152).
 *
 * Names match the ADR exactly (English). Localization (Ukrainian) is a
 * future i18n task — not in scope for this iteration.
 */

interface SystemTagSpec {
  name: string;
  color: string;
  children: Array<{ name: string; color: string }>;
}

const SYSTEM_TAG_SPECS: SystemTagSpec[] = [
  {
    name: 'Investment',
    color: '#1B5E20',
    children: [
      { name: 'Long-term', color: '#388E3C' },
      { name: 'Short-term', color: '#66BB6A' },
      { name: 'Speculative', color: '#A5D6A7' },
    ],
  },
  {
    name: 'Income type',
    color: '#0D47A1',
    children: [
      { name: 'Fixed income', color: '#1976D2' },
      { name: 'Dividend', color: '#42A5F5' },
      { name: 'Growth', color: '#90CAF9' },
    ],
  },
  {
    name: 'Purpose',
    color: '#BF360C',
    children: [
      { name: 'Pension', color: '#E65100' },
      { name: 'Emergency', color: '#FB8C00' },
      { name: 'Trading', color: '#FFB74D' },
    ],
  },
];

/**
 * Produces 12 system tags (3 roots + 9 leaves) with freshly generated UUIDs
 * and matching `createdAt` timestamps. Used by `TagsService.init()` on the
 * very first launch.
 */
export function createSystemTags(): ITag[] {
  const now = new Date().toISOString();
  const tags: ITag[] = [];

  for (const root of SYSTEM_TAG_SPECS) {
    const rootId = uuid();
    tags.push({
      id: rootId,
      name: root.name,
      parentId: undefined,
      color: root.color,
      system: true,
      createdAt: now,
    });

    for (const child of root.children) {
      tags.push({
        id: uuid(),
        name: child.name,
        parentId: rootId,
        color: child.color,
        system: true,
        createdAt: now,
      });
    }
  }

  return tags;
}

/**
 * Returns the canonical list of system tag names (parents and children).
 * Used by tests and the bootstrap recovery logic when we want to detect
 * "missing system tags" without relying on IDs (which vary per device).
 */
export const SYSTEM_TAG_NAMES: readonly string[] = SYSTEM_TAG_SPECS.flatMap(
  (root) => [root.name, ...root.children.map((c) => c.name)],
);
