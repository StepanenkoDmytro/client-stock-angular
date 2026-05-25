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
    /**
     * When true, `HoldingService` seeds 9 demo holdings (BTC × 3 locations,
     * AAPL × 2 brokers, etc.) on a fresh localStorage. Off in production so
     * real beta testers start from an empty portfolio. Flip to true locally
     * for screenshot / story sessions only.
     */
    demoData: false,
    /**
     * Public Google Sheets template that opens with «Make a copy» (URL
     * suffix `/copy`). Used by the Spending Excel/CSV import flow
     * (task §3.3 option B). Leave empty to hide the «Open in Google
     * Sheets» button — the CSV download still works. To enable, create
     * a sheet in Drive, set sharing to «Anyone with the link — Viewer»,
     * then paste the URL here in the form:
     *   https://docs.google.com/spreadsheets/d/{ID}/copy
     */
    importTemplateGsheetUrl: '',
};
