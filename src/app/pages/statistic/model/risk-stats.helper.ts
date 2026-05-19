import { AccountKind } from '../../../domain/account-kind.domain';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHolding } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import {
  IAccountV2,
  accountDisplayName,
} from '../../../domain/account-v2.domain';

/**
 * Custody tier for a holding based on its AccountKind. Drives the W4
 * counterparty-risk widget (Stats Task 2 §4).
 *
 *  - `self`     — user controls the keys (cold/hot wallet) or treats
 *                 it as such (MANUAL = unspecified manual entry).
 *  - `exchange` — held by a centralised counterparty (CEX, bank).
 *  - `unknown`  — holding has no `accountKind` field (legacy seed,
 *                 imported data) — surface separately so user can fix.
 */
export type CustodyTier = 'self' | 'exchange' | 'unknown';

export function custodyTierFor(kind: AccountKind | undefined): CustodyTier {
  switch (kind) {
    case 'WALLET_COLD':
    case 'WALLET_HOT':
    case 'MANUAL':
      return 'self';
    case 'EXCHANGE_SPOT':
    case 'EXCHANGE_EARN':
    case 'EXCHANGE_FUTURES':
    case 'BROKERAGE_CASH':
    case 'BROKERAGE_MARGIN':
    case 'BANK_DEPOSIT':
    case 'BANK_SAVINGS':
    case 'BANK_CURRENT':
      return 'exchange';
    case undefined:
      return 'unknown';
  }
}

/**
 * Severity buckets for the W5 SPOF warning. Ratio = single-largest
 * account's value / portfolio total. Tighter thresholds than counterparty
 * risk because a single-account compromise is binary (you lose all of
 * it, not a fraction).
 */
export type SpofSeverity = 'safe' | 'medium' | 'amber' | 'red';

export const SPOF_THRESHOLDS = {
  MEDIUM: 0.40,
  AMBER: 0.60,
  RED: 0.80,
} as const;

export function spofSeverity(ratio: number): SpofSeverity {
  if (ratio >= SPOF_THRESHOLDS.RED) return 'red';
  if (ratio >= SPOF_THRESHOLDS.AMBER) return 'amber';
  if (ratio >= SPOF_THRESHOLDS.MEDIUM) return 'medium';
  return 'safe';
}

/**
 * Thresholds for the W4 counterparty risk widget — fraction of class
 * value sitting on centralised counterparties. >30% warns softly,
 * >70% warns hard. Source: brainstorm cases A.1/A.3/A.6.
 */
export const COUNTERPARTY_THRESHOLDS = {
  AMBER: 0.30,
  RED: 0.70,
} as const;

export type CounterpartyRiskLevel = 'low' | 'amber' | 'red';

export function counterpartyRiskFor(exchangeRatio: number): CounterpartyRiskLevel {
  if (exchangeRatio >= COUNTERPARTY_THRESHOLDS.RED) return 'red';
  if (exchangeRatio >= COUNTERPARTY_THRESHOLDS.AMBER) return 'amber';
  return 'low';
}

export interface CustodyMix {
  assetClass: AssetClass;
  selfCustodyValue: number;
  exchangeValue: number;
  unknownValue: number;
  totalValue: number;
  selfCustodyRatio: number;
  exchangeRatio: number;
  unknownRatio: number;
  riskLevel: CounterpartyRiskLevel;
  selfCustodyAccountNames: string[];
  exchangeAccountNames: string[];
}

/**
 * Aggregate holdings of one AssetClass by `custodyTierFor(accountKind)`.
 * Returns `null` when the class has no holdings — caller hides the
 * widget in that case (W4 spec: "no crypto → no widget").
 */
export function computeCustodyMix(
  cls: AssetClass,
  holdings: ReadonlyArray<IHolding>,
  accounts: ReadonlyArray<IAccountV2>,
  instruments: ReadonlyMap<string, IInstrument>,
): CustodyMix | null {
  const accountById = new Map<string, IAccountV2>();
  for (const a of accounts) accountById.set(a.id, a);

  let selfValue = 0;
  let exchangeValue = 0;
  let unknownValue = 0;
  const selfNames = new Set<string>();
  const exchangeNames = new Set<string>();

  for (const h of holdings) {
    const inst = instruments.get(h.instrumentId);
    if (!inst || inst.assetClass !== cls) continue;
    const value = (h.quantity ?? 0) * (h.averageBuyPrice ?? 0);
    if (value <= 0) continue;

    const tier = custodyTierFor(h.accountKind);
    const acc = h.accountId ? accountById.get(h.accountId) : undefined;
    const accName = acc
      ? accountDisplayName(acc)
      : (h.accountName ?? '(unknown account)');

    switch (tier) {
      case 'self':
        selfValue += value;
        selfNames.add(accName);
        break;
      case 'exchange':
        exchangeValue += value;
        exchangeNames.add(accName);
        break;
      case 'unknown':
        unknownValue += value;
        break;
    }
  }

  const total = selfValue + exchangeValue + unknownValue;
  if (total <= 0) {
    return null;
  }

  const exchangeRatio = exchangeValue / total;
  return {
    assetClass: cls,
    selfCustodyValue: selfValue,
    exchangeValue,
    unknownValue,
    totalValue: total,
    selfCustodyRatio: selfValue / total,
    exchangeRatio,
    unknownRatio: unknownValue / total,
    riskLevel: counterpartyRiskFor(exchangeRatio),
    selfCustodyAccountNames: [...selfNames].sort((a, b) => a.localeCompare(b)),
    exchangeAccountNames: [...exchangeNames].sort((a, b) => a.localeCompare(b)),
  };
}

export interface SpofExposure {
  accountId: string;
  accountName: string;
  value: number;
  shareOfPortfolio: number;
  severity: SpofSeverity;
  hasMultipleAccounts: boolean;
}

/**
 * Walk all holdings, find the single account holding the largest
 * cost-basis value, classify severity. Returns `null` when the
 * portfolio is empty.
 */
export function computeSpof(
  holdings: ReadonlyArray<IHolding>,
  accounts: ReadonlyArray<IAccountV2>,
  instruments: ReadonlyMap<string, IInstrument>,
): SpofExposure | null {
  const accountById = new Map<string, IAccountV2>();
  for (const a of accounts) accountById.set(a.id, a);

  const perAccount = new Map<string, number>();
  let total = 0;
  for (const h of holdings) {
    const inst = instruments.get(h.instrumentId);
    if (!inst) continue;
    const value = (h.quantity ?? 0) * (h.averageBuyPrice ?? 0);
    if (value <= 0) continue;
    const accId = h.accountId ?? '__unassigned__';
    perAccount.set(accId, (perAccount.get(accId) ?? 0) + value);
    total += value;
  }
  if (perAccount.size === 0 || total <= 0) {
    return null;
  }

  let topId = '';
  let topValue = -Infinity;
  for (const [id, value] of perAccount.entries()) {
    if (value > topValue) {
      topId = id;
      topValue = value;
    }
  }
  const acc = accountById.get(topId);
  const accName = acc
    ? accountDisplayName(acc)
    : (topId === '__unassigned__' ? '(unassigned)' : '(unknown account)');
  const share = topValue / total;
  return {
    accountId: topId,
    accountName: accName,
    value: topValue,
    shareOfPortfolio: share,
    severity: spofSeverity(share),
    hasMultipleAccounts: perAccount.size > 1,
  };
}
