/**
 * Development environment.
 *
 * Used when:
 *   - `npm start` / `ng serve`                    → local dev-server (port 4200)
 *   - `npm run build:dev` / `--configuration=development`
 *   - `docker compose -f docker-compose.yml -f docker-compose.local.yml up --build`
 *     (the local override passes BUILD_MODE=dev to the client image)
 *
 * Backend in this mode lives on http://localhost:8000 (Spring server in the
 * `stock-archive-server` container, port-mapped 1:1 to the host).
 *
 * The browser always runs on the host (not inside the client container), so
 * `localhost:8000` resolves to the same host where Docker exposes the server.
 */
export const environment = {
    production: false,
    /** Base URL up to and including /api/v1 (no trailing slash). */
    apiBaseUrl: 'http://localhost:8000/api/v1',
};
