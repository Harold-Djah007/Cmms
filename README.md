# SafiMaintain

SafiMaintain is a maintenance CMMS for Safisana: clear work queues, connected equipment and inventory records, and familiar workflows with fewer steps. It uses the [public Fiix operating model](https://fiixsoftware.com/cmms/features/) as a reference while retaining its own branding and implementation.

## Version 10

The October 7 rebuild replaces the dashboard, asset/parts registers and work-order register with a new presentation layer. A single active stylesheet supplies the teal/slate design across navigation, tables, record tabs, forms, dialogs and supporting pages. It is based on read-only inspection of the authenticated Fiix workspace; operational data and domain transactions are retained.

Run `python scripts/run_demo.py` for the isolated sample workspace. The launcher chooses an available port and opens the browser. Alternatively, `npm run demo` prints a link. Validate with `npm test`, `npm run test:browser`, and `python -m pytest -q backend/tests`. See [PRESENTATION.md](PRESENTATION.md) for the rehearsal and [ACCOUNT_SETUP.md](ACCOUNT_SETUP.md) for live account/email setup.

- A maintenance-first home with open, overdue, due-today, assigned and unassigned work queues, direct record access, equipment attention, preventive maintenance and request triage.
- Consistent breadcrumbs, permission-aware home actions and clear empty states. Dashboard totals come from saved records and exclude closed work and inactive stock locations.
- A consistent desktop, tablet and phone interface across dashboard, work, assets, inventory, reports and administration.
- Clear Work, Assets and Inventory navigation. Reorder demand belongs inside Inventory; offline/sync status is always accessible.
- Readable lists, forms and record details, visible keyboard focus, keyboard-accessible records and a calmer dashboard.
- Work-order essentials first, with optional planning details available on demand.
- Live work search, request triage, tasks, labor, parts consumption, completion controls and closed-record protection.
- Time, meter and event maintenance plans. Floating time triggers advance after their linked work completes.
- Multi-location parts, receipts, issues, transfers, counts, batch adjustments, BOMs and supplier records.
- Validated, auditable stock movements with FIFO costing. Failed issues do not consume value; stock balance changes must match new ledger entries.
- Asset hierarchy, online/offline state, downtime, meters, maintenance history and QR tags.
- Shared attachments for assets, work, requests and parts, with local file copies for field use.
- Durable sync queues that preserve edits during saves, outages and reconnects. Stale changes are retained as a recovery copy.
- An offline application shell that excludes API responses and supports versioned asset URLs.
- Existing workspaces survive reloads. New workspaces start empty; demo records are explicitly identified.
- Server-enforced permissions, revision conflicts, immutable history and explicit authentication-proxy trust.
- SMTP delivery records are saved after each accepted message, including when later delivery fails or another user saves concurrently.

Purchasing remains external. SafiMaintain produces a **Reorder list** and does not create purchase orders or RFQs.

## Run locally

For the board presentation, double-click **Start Demo.cmd**, or run `python scripts/run_demo.py`. It selects a free port, opens a separate sample workspace, and requires only Python and a browser. See [PRESENTATION.md](PRESENTATION.md) for the rehearsal sequence and deployment boundaries.

```bash
docker compose up --build
```

Open `http://localhost:8080`. Compose is a development configuration: authentication is deliberately enabled for the local developer and the port binds only to the local machine. The named `safimaint_data` volume holds the database and attachments.

Without Docker:

```bash
pip install -r backend/requirements-dev.txt
```

Set `SAFIMAINT_DEV_AUTH=true`, then run:

```bash
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

The API documentation is at `http://localhost:8000/api/docs`.

For a device-only preview:

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Open `http://localhost:8765` to create a fresh local workspace, or `http://localhost:8765/?device=1` to explore a sample workspace. Device mode stores records in that browser; Shared mode uses the API, database and attachment service.

## Verify

```bash
python -m pytest -q backend/tests
npm ci
npm test
npx playwright install chromium
npm run test:browser
```

The browser suite starts its own local server and checks all 29 main pages, live search, creation and closure of work, floating maintenance, stock/FIFO integrity, linked work consumption, mobile navigation and a real offline reload. It uses a disposable browser context and does not write to a shared workspace.

For an existing preview, set `SAFIMAINT_TEST_URL`. To use an installed Chrome/Edge executable, set `SAFIMAINT_BROWSER_PATH`. CI runs backend tests, JavaScript syntax checks, all frontend regressions and browser acceptance checks.

## Project layout

- `backend/app/`: FastAPI service, SQLite persistence, identity, permissions and validation.
- `backend/tests/`: backend and security regression tests.
- `dist/`: served application source, including the numbered operational modules.
- `dist/assets/safimaint-system-v91.css`: current shared visual system.
- `dist/assets/safimaint-system-v91.js`: shared onboarding, demo labeling and keyboard support.
- `dist/assets/safimaint-maintenance-workspace.js` and `.css`: maintenance overview, record drill-downs, shared breadcrumbs and consistent operating controls.
- `dist/assets/safimaint-supplies-v93.js` and `.css`: location hierarchy, parts list and compact Stock record, based on Fiix's March 2026 [list guide](https://helpdesk.fiixsoftware.com/hc/en-us/articles/211751446-Update-parts-and-supplies-using-bulk-import) and [current record guide](https://helpdesk.fiixsoftware.com/hc/en-us/articles/25767494813076-Edit-parts-details). Purchasing remains external.
- `tests/`: frontend regressions; `tests/run_regressions.js` discovers all suites.
- `scripts/browser_acceptance.cjs`: connected browser workflow checks.

The frontend retains earlier modules for compatibility. Current scripts are wired in `dist/index.html`; `dist/service-worker.js` must include every loaded asset. Historical tests inspect retained modules, while the app-shell and browser tests verify the active application.

## Production configuration

See [PRODUCTION.md](PRODUCTION.md) for deployment acceptance, monitoring and verified backup/restore commands, and `.env.production.example` for the required configuration. Set `SAFIMAINT_ENVIRONMENT=production` and `SAFIMAINT_ALLOWED_HOSTS` to your real hostname. Runtime dependencies are pinned and audited in CI.

Deploy `backend/Dockerfile` behind Microsoft Entra / Azure App Service Authentication, mount `/app/data` on durable encrypted storage, and configure:

```text
SAFIMAINT_DEV_AUTH=false
SAFIMAINT_TRUST_AUTH_HEADERS=true
SAFIMAINT_OWNER_EMAILS=operations.manager@company.com
SAFIMAINT_DATABASE_PATH=/app/data/safimaint.db
SAFIMAINT_ATTACHMENT_PATH=/app/data/attachments
SMTP_HOST=your-relay
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_FROM=SafiMaintain <maintenance@company.com>
```

Enable `SAFIMAINT_TRUST_AUTH_HEADERS` only when the authentication proxy removes caller-supplied identity headers and every API request must pass through that proxy. Direct APIs reject those identity headers by default. The first configured owner initializes the workspace; later access resolves through People and Roles.

Use the default single API worker for the current SQLite deployment and mail-delivery lock. Back up the database and attachments together. Larger multi-site or multi-worker deployments need a managed database, object storage and a dedicated durable mail worker.

Entra/MFA policies, SMTP credentials, encrypted backups, monitoring and disaster recovery must be configured and verified in the deployment environment. Automated checks establish the repository's tested behavior; operational acceptance still requires your team's real workflows and data.
