import { AccountKind } from '../../../domain/account-kind.domain';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IHoldingLockMeta } from '../../../domain/holding.domain';
import { IInstrument } from '../../../domain/instrument.domain';

/**
 * Payload an archetype component emits via {@code (stateChange)} once its
 * form is valid. Orchestrator (`AddHoldingComponent`) wraps this into a
 * full `IHolding` with id / createdAt / updatedAt and dispatches to
 * {@code HoldingService.addHolding}.
 */
export interface ArchetypeSubmission {
  instrument: IInstrument;
  quantity: number;
  averageBuyPrice: number;
  currency: string;
  accountId: string;
  accountName: string;
  accountKind: AccountKind;
  tagIds: string[];
  lockMeta?: IHoldingLockMeta;
}

/** Payload of the `(stateChange)` event archetypes emit. */
export interface ArchetypeState {
  valid: boolean;
  submission: ArchetypeSubmission | null;
}

/**
 * One of three form shapes the Add Holding flow renders, after the user
 * picks an {@link AssetClass} from the class-grid. Source of truth —
 * `docs/design-roadmap.md §13` + PR5b task-doc §4.
 */
export enum AddHoldingArchetype {
  /** Stock / ETF / Tokenized / Crypto — autocomplete + qty + price. */
  MARKET_BACKED = 'MARKET_BACKED',
  /** Real estate / Deposit / Other — create-instrument-inline + price. */
  MANUAL_CREATE = 'MANUAL_CREATE',
  /** Cash — currency picker + single amount. */
  SINGLE_AMOUNT = 'SINGLE_AMOUNT',
}

/**
 * Routes an {@link AssetClass} to the archetype its form follows.
 * Exhaustive `switch` — TypeScript will refuse to compile when a new
 * AssetClass is added without an explicit mapping here.
 */
export function archetypeForClass(c: AssetClass): AddHoldingArchetype {
  switch (c) {
    case AssetClass.STOCK:
    case AssetClass.ETF:
    case AssetClass.TOKENIZED_STOCK:
    case AssetClass.CRYPTO:
      return AddHoldingArchetype.MARKET_BACKED;
    case AssetClass.REAL_ESTATE:
    case AssetClass.DEPOSIT:
    case AssetClass.OTHER:
      return AddHoldingArchetype.MANUAL_CREATE;
    case AssetClass.CASH:
      return AddHoldingArchetype.SINGLE_AMOUNT;
  }
}

/**
 * URL fragments / case-insensitive identifiers used on
 * `/savings/add-holding/:class`. Lowercased AssetClass values; the
 * reverse parse is {@link assetClassFromSlug}.
 */
export const ASSET_CLASS_SLUGS: Readonly<Record<AssetClass, string>> = {
  [AssetClass.STOCK]: 'stock',
  [AssetClass.ETF]: 'etf',
  [AssetClass.TOKENIZED_STOCK]: 'tokenized-stock',
  [AssetClass.CRYPTO]: 'crypto',
  [AssetClass.CASH]: 'cash',
  [AssetClass.DEPOSIT]: 'deposit',
  [AssetClass.REAL_ESTATE]: 'real-estate',
  [AssetClass.OTHER]: 'other',
};

/** Inverse of {@link ASSET_CLASS_SLUGS}. Returns null for unknown slugs. */
export function assetClassFromSlug(slug: string): AssetClass | null {
  const normalised = slug.toLowerCase();
  for (const ac of Object.keys(ASSET_CLASS_SLUGS) as AssetClass[]) {
    if (ASSET_CLASS_SLUGS[ac] === normalised) {
      return ac;
    }
  }
  return null;
}

/** Card metadata for the class-grid entry point. */
export interface AddHoldingClassCard {
  assetClass: AssetClass;
  label: string;
  subtitle: string;
  /** Material icon name. */
  icon: string;
  /** CSS variable name for the soft-tint chip background. */
  tintVar: string;
}

/**
 * Ordered list rendered by `pgz-add-holding-class-grid`. Order matches
 * Approved mockup `04-add-holding-variant-b-detailed.svg` (Stock first,
 * Crypto second, etc.). New classes append to the end.
 */
export const ADD_HOLDING_CLASS_CARDS: ReadonlyArray<AddHoldingClassCard> = [
  {
    assetClass: AssetClass.STOCK,
    label: 'Stock & ETF',
    subtitle: 'shares · funds',
    icon: 'trending_up',
    tintVar: '--asset-stock',
  },
  {
    assetClass: AssetClass.CRYPTO,
    label: 'Crypto',
    subtitle: 'coins · tokens',
    icon: 'currency_bitcoin',
    tintVar: '--asset-crypto',
  },
  {
    assetClass: AssetClass.REAL_ESTATE,
    label: 'Real estate',
    subtitle: 'apartments · houses',
    icon: 'home',
    tintVar: '--asset-real-estate',
  },
  {
    assetClass: AssetClass.CASH,
    label: 'Cash',
    subtitle: 'fiat balance',
    icon: 'savings',
    tintVar: '--asset-cash',
  },
  {
    assetClass: AssetClass.DEPOSIT,
    label: 'Deposit',
    subtitle: 'bank · term',
    icon: 'account_balance',
    tintVar: '--asset-deposit',
  },
  {
    assetClass: AssetClass.OTHER,
    label: 'Other',
    subtitle: 'custom asset',
    icon: 'category',
    tintVar: '--asset-other',
  },
];

/** Placeholder cards for classes flagged FUTURE in the roadmap. */
export interface FutureClassCard {
  label: string;
  subtitle: string;
  icon: string;
}

export const FUTURE_CLASS_CARDS: ReadonlyArray<FutureClassCard> = [
  { label: 'Bonds', subtitle: 'government · corporate', icon: 'receipt_long' },
  { label: 'Commodities', subtitle: 'gold · oil', icon: 'oil_barrel' },
  { label: 'P2P loans', subtitle: 'private lending', icon: 'handshake' },
];
