import { AssetClass } from '../../../domain/asset-class.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { IHolding } from '../../../domain/holding.domain';
import {
  IAccountV2,
  accountDisplayName,
  AccountTypeV2,
} from '../../../domain/account-v2.domain';

/**
 * One account's slice of an {@link AssetClass} total — drives a single
 * segment in the W3 stacked bar.
 */
export interface AccountSegment {
  accountId: string;
  accountName: string;
  accountType: AccountTypeV2;
  value: number;
  share: number; // 0..1, fraction of the parent class total
}

/**
 * All segments for one class, sorted desc by value. Total of segments
 * equals {@link #totalValue} within floating-point noise.
 */
export interface ClassBreakdown {
  classKey: AssetClass;
  className: string;
  totalValue: number;
  segments: AccountSegment[];
}

/**
 * Human-readable label for the class header — same vocabulary as
 * `pgz-position-card`'s `assetClassLabel`. Kept inline (not imported)
 * to avoid pulling the position-card component into the stats track.
 */
function assetClassLabel(ac: AssetClass): string {
  switch (ac) {
    case AssetClass.STOCK:           return 'Stock';
    case AssetClass.ETF:             return 'ETF';
    case AssetClass.TOKENIZED_STOCK: return 'Tokenized stock';
    case AssetClass.CRYPTO:          return 'Crypto';
    case AssetClass.CASH:            return 'Cash';
    case AssetClass.DEPOSIT:         return 'Deposit';
    case AssetClass.REAL_ESTATE:     return 'Real estate';
    case AssetClass.OTHER:           return 'Other';
  }
}

/**
 * Cross-tabulate holdings × accounts into per-class breakdowns. Pure
 * function — selector wraps it with NgRx memoisation. Used by W3.
 *
 * <p>Algorithm:
 * <ol>
 *   <li>Walk every holding, resolve its instrument's AssetClass, bucket
 *       the cost-basis value (`quantity × averageBuyPrice`) under
 *       `class → accountId`.</li>
 *   <li>For each class bucket, build sorted segments (desc by value)
 *       with `share = segment.value / classTotal`.</li>
 *   <li>Skip classes whose total resolves to 0 (no holdings in that class).</li>
 * </ol>
 *
 * <p>Unknown account ids on a holding (orphan after delete that
 * cascade didn't reach localStorage) get a synthetic
 * `accountName="(unknown account)"` so they still show up in the bar
 * instead of disappearing silently.
 */
export function computeClassAccountMatrix(
  holdings: ReadonlyArray<IHolding>,
  accounts: ReadonlyArray<IAccountV2>,
  instruments: ReadonlyMap<string, IInstrument>,
): ClassBreakdown[] {
  const accountById = new Map<string, IAccountV2>();
  for (const a of accounts) accountById.set(a.id, a);

  // First pass: class → accountId → value
  const matrix = new Map<AssetClass, Map<string, number>>();
  for (const h of holdings) {
    const inst = instruments.get(h.instrumentId);
    if (!inst) continue;
    const value = (h.quantity ?? 0) * (h.averageBuyPrice ?? 0);
    if (value <= 0) continue;
    const accId = h.accountId ?? '__unassigned__';
    const classBucket =
      matrix.get(inst.assetClass) ??
      (matrix.set(inst.assetClass, new Map()).get(inst.assetClass) as Map<string, number>);
    classBucket.set(accId, (classBucket.get(accId) ?? 0) + value);
  }

  // Second pass: shape into ClassBreakdown[] with segments sorted desc.
  const result: ClassBreakdown[] = [];
  for (const [classKey, perAccount] of matrix.entries()) {
    let total = 0;
    for (const v of perAccount.values()) total += v;
    if (total <= 0) continue;

    const segments: AccountSegment[] = [];
    for (const [accountId, value] of perAccount.entries()) {
      const acc = accountById.get(accountId);
      segments.push({
        accountId,
        accountName: acc ? accountDisplayName(acc) : '(unknown account)',
        accountType: acc?.accountType ?? 'MANUAL',
        value,
        share: total > 0 ? value / total : 0,
      });
    }
    segments.sort((a, b) => b.value - a.value);
    result.push({
      classKey,
      className: assetClassLabel(classKey),
      totalValue: total,
      segments,
    });
  }
  // Stable class ordering: desc by totalValue so the biggest bucket
  // shows first (mirrors PortfolioSummary breakdown rows).
  result.sort((a, b) => b.totalValue - a.totalValue);
  return result;
}
