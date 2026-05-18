import { AssetClass } from '../../../domain/asset-class.domain';
import {
  ADD_HOLDING_CLASS_CARDS,
  AddHoldingArchetype,
  ASSET_CLASS_SLUGS,
  archetypeForClass,
  assetClassFromSlug,
  FUTURE_CLASS_CARDS,
} from './AddHoldingArchetype';

describe('archetypeForClass', () => {
  it('maps market-backed classes to MARKET_BACKED', () => {
    expect(archetypeForClass(AssetClass.STOCK)).toBe(AddHoldingArchetype.MARKET_BACKED);
    expect(archetypeForClass(AssetClass.ETF)).toBe(AddHoldingArchetype.MARKET_BACKED);
    expect(archetypeForClass(AssetClass.TOKENIZED_STOCK)).toBe(AddHoldingArchetype.MARKET_BACKED);
    expect(archetypeForClass(AssetClass.CRYPTO)).toBe(AddHoldingArchetype.MARKET_BACKED);
  });

  it('maps manual-only classes to MANUAL_CREATE', () => {
    expect(archetypeForClass(AssetClass.REAL_ESTATE)).toBe(AddHoldingArchetype.MANUAL_CREATE);
    expect(archetypeForClass(AssetClass.DEPOSIT)).toBe(AddHoldingArchetype.MANUAL_CREATE);
    expect(archetypeForClass(AssetClass.OTHER)).toBe(AddHoldingArchetype.MANUAL_CREATE);
  });

  it('maps CASH to SINGLE_AMOUNT', () => {
    expect(archetypeForClass(AssetClass.CASH)).toBe(AddHoldingArchetype.SINGLE_AMOUNT);
  });
});

describe('ASSET_CLASS_SLUGS / assetClassFromSlug', () => {
  it('round-trips every AssetClass', () => {
    for (const ac of Object.values(AssetClass)) {
      const slug = ASSET_CLASS_SLUGS[ac];
      expect(slug).toBeTruthy();
      expect(assetClassFromSlug(slug)).toBe(ac);
    }
  });

  it('parse is case-insensitive', () => {
    expect(assetClassFromSlug('STOCK')).toBe(AssetClass.STOCK);
    expect(assetClassFromSlug('Stock')).toBe(AssetClass.STOCK);
    expect(assetClassFromSlug('TOKENIZED-stock')).toBe(AssetClass.TOKENIZED_STOCK);
  });

  it('returns null for unknown slug', () => {
    expect(assetClassFromSlug('not-a-class')).toBeNull();
    expect(assetClassFromSlug('')).toBeNull();
  });
});

describe('grid card metadata', () => {
  it('exposes exactly 6 active asset-class cards', () => {
    expect(ADD_HOLDING_CLASS_CARDS).toHaveSize(6);
  });

  it('each active card maps to a known AssetClass with a label and icon', () => {
    for (const card of ADD_HOLDING_CLASS_CARDS) {
      expect(Object.values(AssetClass)).toContain(card.assetClass);
      expect(card.label.length).toBeGreaterThan(0);
      expect(card.icon.length).toBeGreaterThan(0);
      expect(card.tintVar).toMatch(/^--asset-/);
    }
  });

  it('exposes future placeholders distinct from active cards', () => {
    expect(FUTURE_CLASS_CARDS.length).toBeGreaterThan(0);
    for (const f of FUTURE_CLASS_CARDS) {
      expect(f.label.length).toBeGreaterThan(0);
      expect(f.icon.length).toBeGreaterThan(0);
    }
  });
});
