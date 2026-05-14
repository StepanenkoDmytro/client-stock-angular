/**
 * Production environment.
 *
 * Used by:
 *   - `ng build` / `npm run build:prod`           → production bundle
 *   - default `docker compose up --build`         → server points at pegazzo.online
 *
 * For local development against a locally-running backend on port 8000,
 * use environment.development.ts (selected via Angular's fileReplacements
 * when building with `--configuration=development` / `npm run start`).
 */
export const environment = {
    production: true,
    /** Base URL up to and including /api/v1 (no trailing slash). */
    apiBaseUrl: 'https://pegazzo.online/money-life-cycle/api/v1',
};
