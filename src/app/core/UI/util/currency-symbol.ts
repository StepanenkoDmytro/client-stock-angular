/**
 * Maps ISO 4217 currency codes used in the app (the 9 entries from
 * `SUPPORTED_BASE_CURRENCIES`) to a short display glyph. Falls back to
 * the 3-letter code itself for unknown codes so the UI never blanks
 * out — useful while crypto or per-region currencies are gated behind
 * future work (ADR-0002 open question on `baseCurrency = BTC`).
 */
const SYMBOLS: Readonly<Record<string, string>> = {
  USD: '$',
  EUR: '€',
  UAH: '₴',
  PLN: 'zł',
  GBP: '£',
  CHF: 'Fr',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

export function currencySymbol(code: string | null | undefined): string {
  if (!code) {
    return '$';
  }
  return SYMBOLS[code.toUpperCase()] ?? code.toUpperCase();
}
