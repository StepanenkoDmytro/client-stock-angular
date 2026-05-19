/**
 * ISO 3166-1 alpha-2 → display label resolution for the Stats Task 3
 * jurisdiction widget and the Account-form country picker.
 *
 * <p>We hardcode the top-20 most-likely jurisdictions for our launch
 * market (EU + UK + UA per monetization §5). Any other valid ISO code
 * passed to {@link jurisdictionLabel} resolves to a generated flag +
 * the raw uppercased code as the name — so a power user typing "JP"
 * sees 🇯🇵 JP rather than a "country not found" stub. A full ISO
 * library is unnecessary noise for MVP.
 */

export interface JurisdictionLabel {
  /** Uppercased ISO 3166-1 alpha-2, or the literal `'UNSPECIFIED'`. */
  iso: string;
  /** Human-readable name ("Ukraine", "United States", "Unspecified"). */
  name: string;
  /** Emoji flag (🇺🇦 / 🇺🇸 / ❓ for the unspecified bucket). */
  flag: string;
}

const UNSPECIFIED: JurisdictionLabel = {
  iso: 'UNSPECIFIED',
  name: 'Unspecified',
  flag: '❓',
};

/** Country names for the hardcoded top-20 list. */
const NAMES: Readonly<Record<string, string>> = {
  UA: 'Ukraine',
  PL: 'Poland',
  DE: 'Germany',
  NL: 'Netherlands',
  IE: 'Ireland',
  CH: 'Switzerland',
  GB: 'United Kingdom',
  US: 'United States',
  CA: 'Canada',
  EE: 'Estonia',
  LV: 'Latvia',
  LT: 'Lithuania',
  CZ: 'Czechia',
  SK: 'Slovakia',
  AT: 'Austria',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  SE: 'Sweden',
  FI: 'Finland',
};

/**
 * Most-likely jurisdictions for our target audience. Order roughly tracks
 * regional relevance: UA / EU-near-UA / common destinations / wider EU.
 * Account-form picker shows this list first, then divider, then anything
 * else typed manually.
 */
export const POPULAR_JURISDICTIONS: ReadonlyArray<string> = [
  'UA', 'PL', 'DE', 'NL', 'IE', 'CH', 'GB', 'US', 'CA', 'EE',
  'LV', 'LT', 'CZ', 'SK', 'AT', 'FR', 'ES', 'IT', 'SE', 'FI',
];

/**
 * ISO 3166-1 alpha-2 → emoji flag through the regional-indicator
 * Unicode block (U+1F1E6 + offset for 'A'..'Z'). Works in modern
 * browsers + iOS / Android natively; older Windows builds may render
 * the raw indicator characters instead of a flag — accepted trade-off.
 */
function flagFor(iso: string): string {
  if (iso.length !== 2) return '🏳';
  const base = 0x1F1E6;
  const codeA = 'A'.charCodeAt(0);
  const c0 = base + (iso.charCodeAt(0) - codeA);
  const c1 = base + (iso.charCodeAt(1) - codeA);
  return String.fromCodePoint(c0, c1);
}

/**
 * Resolve an ISO code to its display label. Lowercase input is
 * normalised. Unknown / empty / whitespace / non-2-letter inputs return
 * the unspecified bucket so callers can render without branching.
 */
export function jurisdictionLabel(iso: string | null | undefined): JurisdictionLabel {
  if (!iso) return UNSPECIFIED;
  const code = iso.trim().toUpperCase();
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) {
    return UNSPECIFIED;
  }
  const name = NAMES[code] ?? code;
  return {
    iso: code,
    name,
    flag: flagFor(code),
  };
}

/**
 * Build picker options for the Account form. Returns the popular set
 * (with full labels) sorted alphabetically by country name. Power users
 * can still type any ISO code manually via mat-select's typeahead.
 */
export function jurisdictionPickerOptions(): JurisdictionLabel[] {
  return POPULAR_JURISDICTIONS
    .map((iso) => jurisdictionLabel(iso))
    .sort((a, b) => a.name.localeCompare(b.name));
}
