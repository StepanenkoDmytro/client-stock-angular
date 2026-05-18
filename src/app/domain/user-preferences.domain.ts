/**
 * Mirror of backend `UserPreferencesDto` (`GET / PUT /api/v1/me/preferences`).
 * M3 surfaces only {@link baseCurrency}; future fields (theme, locale,
 * hide-balances default) extend this interface.
 */
export interface UserPreferences {
  baseCurrency: string;
}

/**
 * Whitelist matching the backend `UserPreferencesController`. UI picker
 * pulls from this — extending one place should extend the other.
 */
export const SUPPORTED_BASE_CURRENCIES: ReadonlyArray<string> = [
  'USD', 'EUR', 'UAH', 'PLN', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD',
];
