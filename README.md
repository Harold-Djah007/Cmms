# SafiMaintain CMMS

SafiMaintain is Safisana Ghana's stock-first maintenance management application.

The current build uses the **public operating model documented by Fiix CMMS** while giving daily priority to stock taking. It remains SafiMaintain-branded and does not copy Fiix source code, private architecture, or visual assets.

## SafiMaintain 9 stock-first experience

- Fiix-familiar dark navigation, information density, master-detail records, hierarchy and audit patterns.
- A live stockroom control centre replaces the generic maintenance dashboard.
- Parts, cycle counts, movements, assets and work remain connected without crowding daily navigation.
- Subtle animated shelves, stock scanner and conveyor background communicate live inventory activity.
- The main part record has four clear areas: Stock levels, Cycle counts, Used on assets and Movement history.
- Replenishment stops at a simple **Reorder list** for handoff to Safisana's external purchasing process.
- SafiMaintain does **not** create purchase orders, RFQs or supplier orders.
- Motion is disabled automatically for users who prefer reduced motion.

## Implemented operating model

### Work management
- Work requests that can be converted into corrective work orders.
- Work-order priority, status, assignment, due date, instructions, tasks, parts and history.
- Scheduled-maintenance plans with time/meter/event trigger descriptions.
- Manual generation of work orders from maintenance plans.
- Maintenance calendar for upcoming work.

### Asset management
- Parent/child asset hierarchy: site → facility → production area → equipment/subassembly/tool.
- Central asset profile with criticality, condition, manufacturer, model, serial, location, warranty, responsible person/group and commissioning date.
- Independent **condition** and **Online/Offline operating state**.
- Taking an asset offline requires a reason code and note.
- Offline transitions create a downtime event and can automatically create corrective work.
- Returning an asset online closes the active downtime event.
- Asset log, work history, BOM, meter history and downtime history.
- QR/barcode lookup with camera scanning where the browser supports `BarcodeDetector`, plus a manual code fallback.

### Parts and stock taking
- Parts master with category, UOM, unit cost, barcode, preferred vendor, min/max and reorder quantity.
- Multiple store/bin locations per part.
- Receipts, issues, transfers and adjustments.
- Issues can be posted directly against a work order and update actual parts consumption on that work order.
- Cycle counts retain expected, counted, variance, person and time.
- Posting a variance creates the corresponding auditable stock adjustment.
- Low-stock detection maintains an internal reorder signal when no open signal already exists.
- A simple reorder list shows on-hand, min/max, suggested quantity, priority and preferred supplier.
- Purchasing is completed outside SafiMaintain; there is no purchase-order creation workflow.
- Separate durable-tool crib with check-in/check-out.

### Notifications and mail
- Event-driven rules for asset offline/online changes, low stock, work assignment and purchasing demand.
- Stakeholder resolution for operations managers, planners, asset owners/groups, assigned technicians, stores and procurement.
- In-app inbox with read state.
- Email outbox records with subject, recipient, body, time and status.

**Important:** new email records begin as **Queued locally** and do not pretend delivery. When the shared service and SMTP relay are configured, SafiMaintain changes them to **Sent** only after the relay accepts each message.

### Administration and security
- People, groups, manager relationships, roles and permission definitions.
- User activation/deactivation, MFA-enrolment visibility and email preferences.
- Site and store master records.
- Notification-rule configuration.
- Security policy configuration for MFA expectation, session timeout and audit retention.
- Audit trail for critical asset, stock, purchasing, security and administration actions.
- Microsoft Entra-compatible identity, server-enforced RBAC and explicit hosting boundaries for MFA, SSO and IP restrictions.

## Run the shared application locally

Docker is the simplest way to run the UI, API, durable database and attachment service together:

```bash
docker compose up --build
```

Open `http://localhost:8080`. Data and uploaded files remain in the named `safimaint_data` volume. The browser probes `/api/health`, so Docker on port 8080 enters Shared mode while a plain static server on the same port safely remains in Device mode.

For backend development without Docker:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
SAFIMAINT_DEV_AUTH=true SAFIMAINT_DEV_USER_EMAIL=abena.sarpong@safisana.org \
  uvicorn backend.app.main:app --reload --port 8000
```

API documentation is available at `http://localhost:8000/api/docs`.

The old static-only preview still works with `python3 -m http.server 8080 --directory dist`, but it intentionally operates in **Device mode** because there is no API behind it.

## Production controls now implemented

- SQLite WAL persistence with automatic schema migration and durable Docker volume.
- Microsoft Entra / Azure App Service Authentication header support; local development auth is disabled by default.
- Server-enforced role permissions for every changed operational collection.
- Optimistic concurrency: a stale device cannot silently overwrite a newer revision.
- Validation of asset hierarchy cycles, references, IDs, stock floors and work-order relationships.
- Append-only stock transaction and audit ledgers.
- Cryptographically hashed, immutable revision history with admin restore capability.
- Offline field cache and a persistent single-snapshot synchronization queue.
- Conflict recovery copy when another device saves first.
- Permission-checked PDF/image/text attachments with size, type and SHA-256 integrity metadata.
- SMTP relay integration; messages become `Sent` only after relay acceptance.
- Health endpoint, API documentation, Docker health checks and automated tests.

## Production deployment

Build `backend/Dockerfile` in Azure App Service for Containers (or another persistent container host), mount `/app/data` on durable encrypted storage, and configure:

```text
SAFIMAINT_OWNER_EMAILS=operations.manager@company.com
SAFIMAINT_DATABASE_PATH=/app/data/safimaint.db
SAFIMAINT_ATTACHMENT_PATH=/app/data/attachments
SMTP_HOST=your-relay
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_FROM=SafiMaintain <maintenance@company.com>
```

Enable Microsoft Entra authentication at the hosting layer and require authentication for every request. Do **not** enable `SAFIMAINT_DEV_AUTH` in production. The first signed-in owner listed in `SAFIMAINT_OWNER_EMAILS` can initialize the workspace; subsequent access is resolved from the People and Roles records inside SafiMaintain.

Back up both the SQLite database and attachment directory together. For a large multi-site rollout, move the same API contract to a managed relational database and object store before high-concurrency use.

## Verification

```bash
python -m pytest -q backend/tests
for file in dist/assets/*.js dist/service-worker.js; do node --check "$file"; done
node tests/demo_inventory_regression.js
node tests/stock_first_redesign_regression.js
node tests/shared_bootstrap_regression.js
```

## Recommended acceptance test

1. Open **Assets** and select `P-201` / Digester Feed Pump 02.
2. Return it online with a completion note and verify the downtime record closes, the asset log updates, and alerts are created.
3. Take it offline again with a reason and keep **Create a corrective work order** enabled.
4. Open **Work orders** and verify the new corrective WO exists.
5. Open **Stockroom**, select `MS-40-SS`, and issue one unit against the new WO.
6. Confirm the WO's actual parts consumption increases and the part appears on the **Reorder list** when below minimum.
7. Post a **Cycle count** with a variance and verify both count history and the stock transaction ledger.
8. Open **Reorder list** and verify that no purchase-order action is available.
9. Open **Alerts & mail** and verify in-app messages, recipient resolution and the local email queue.
10. Open **People & teams**, **Administration**, **Audit trail**, and **Security** and verify configuration and audit events.
11. Disconnect networking after the app has loaded once and confirm the application shell remains available.

## Remaining deployment boundary

The repository contains the production foundation, but a GitHub commit by itself does not activate Microsoft Entra, SMTP, encrypted backups, monitoring, retention jobs or disaster-recovery drills. Those are infrastructure controls and must be configured in the actual hosting environment before SafiMaintain is approved for live operational records.
