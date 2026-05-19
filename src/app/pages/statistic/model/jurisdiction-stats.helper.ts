import { IHolding } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import {
  IAccountV2,
  accountDisplayName,
} from '../../../domain/account-v2.domain';
import { jurisdictionLabel } from '../../savings/model/jurisdiction.helper';

/**
 * Thresholds for the W6 jurisdiction-concentration warning. Soft amber
 * at 80% — a single-country regulator covers most of your wealth — and
 * hard red at 95% — effectively monoregulation. Conservative because
 * jurisdiction risk takes years to materialise (tax law change, capital
 * controls), so even 80% deserves a calm heads-up.
 */
export const JURISDICTION_THRESHOLDS = {
  AMBER: 0.80,
  RED: 0.95,
} as const;

export type JurisdictionConcentrationLevel = 'safe' | 'amber' | 'red';

export interface JurisdictionSegment {
  iso: string;
  countryName: string;
  flag: string;
  value: number;
  share: number;
  accountNames: string[];
  accountCount: number;
}

export interface JurisdictionBreakdown {
  segments: JurisdictionSegment[];
  totalValue: number;
  /** True when the unspecified bucket alone is >50% — soft prompt copy. */
  hasMostlyUnspecified: boolean;
  /** Top segment's share (0..1), excluding the unspecified bucket. */
  topShareExclUnspecified: number;
  level: JurisdictionConcentrationLevel;
}

export function jurisdictionConcentrationLevel(
  topShare: number,
): JurisdictionConcentrationLevel {
  if (topShare >= JURISDICTION_THRESHOLDS.RED) return 'red';
  if (topShare >= JURISDICTION_THRESHOLDS.AMBER) return 'amber';
  return 'safe';
}

/**
 * Walk every holding, bucket its cost-basis value under the owning
 * account's jurisdiction (or "UNSPECIFIED" when the account hasn't
 * set one). Pure — selector wraps it with NgRx memoisation.
 */
export function computeJurisdictionBreakdown(
  holdings: ReadonlyArray<IHolding>,
  accounts: ReadonlyArray<IAccountV2>,
  instruments: ReadonlyMap<string, IInstrument>,
): JurisdictionBreakdown | null {
  const accountById = new Map<string, IAccountV2>();
  for (const a of accounts) accountById.set(a.id, a);

  // First pass — bucket value + account-name set by jurisdiction code.
  const buckets = new Map<string, { value: number; names: Set<string> }>();
  let totalValue = 0;
  for (const h of holdings) {
    const inst = instruments.get(h.instrumentId);
    if (!inst) continue;
    const value = (h.quantity ?? 0) * (h.averageBuyPrice ?? 0);
    if (value <= 0) continue;

    const acc = h.accountId ? accountById.get(h.accountId) : undefined;
    const label = jurisdictionLabel(acc?.jurisdiction);
    const bucket =
      buckets.get(label.iso) ??
      (buckets.set(label.iso, { value: 0, names: new Set() }).get(label.iso) as { value: number; names: Set<string> });
    bucket.value += value;
    const accName = acc
      ? accountDisplayName(acc)
      : (h.accountName ?? '(unknown account)');
    bucket.names.add(accName);
    totalValue += value;
  }
  if (buckets.size === 0 || totalValue <= 0) {
    return null;
  }

  // Shape into JurisdictionSegment[] sorted desc by value.
  const segments: JurisdictionSegment[] = [];
  for (const [iso, bucket] of buckets.entries()) {
    const label = jurisdictionLabel(iso === 'UNSPECIFIED' ? undefined : iso);
    segments.push({
      iso: label.iso,
      countryName: label.name,
      flag: label.flag,
      value: bucket.value,
      share: bucket.value / totalValue,
      accountNames: [...bucket.names].sort((a, b) => a.localeCompare(b)),
      accountCount: bucket.names.size,
    });
  }
  segments.sort((a, b) => b.value - a.value);

  // Top share excluding unspecified — used for the concentration warning.
  // The unspecified bucket isn't a real jurisdiction, so a 95% "Unspecified"
  // portfolio shouldn't read as red "concentrated in one country".
  const specified = segments.filter((s) => s.iso !== 'UNSPECIFIED');
  const topShareExclUnspecified = specified.length > 0
    ? specified.reduce((max, s) => (s.share > max ? s.share : max), 0)
    : 0;

  const unspecifiedShare = segments.find((s) => s.iso === 'UNSPECIFIED')?.share ?? 0;

  return {
    segments,
    totalValue,
    hasMostlyUnspecified: unspecifiedShare > 0.5,
    topShareExclUnspecified,
    level: jurisdictionConcentrationLevel(topShareExclUnspecified),
  };
}
