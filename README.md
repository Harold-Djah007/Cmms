# SafiMaintain CMMS

SafiMaintain is Safisana Ghana's field-first maintenance management application.

The current build has been reorganized around the **public operating model documented by Fiix CMMS** rather than around a dashboard template. It remains SafiMaintain-branded and does not copy Fiix source code, private architecture, or visual assets.

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

### Parts, stock taking and purchasing
- Parts master with category, UOM, unit cost, barcode, preferred vendor, min/max and reorder quantity.
- Multiple store/bin locations per part.
- Receipts, issues, transfers and adjustments.
- Issues can be posted directly against a work order and update actual parts consumption on that work order.
- Cycle counts retain expected, counted, variance, person and time.
- Posting a variance creates the corresponding auditable stock adjustment.
- Low-stock detection automatically creates a purchase request when no open request already exists.
- Purchase planning board with approval.
- Purchase-order creation from an approved request or manually.
- PO receiving updates stock and closes linked demand.
- Separate durable-tool crib with check-in/check-out.

### Notifications and mail
- Event-driven rules for asset offline/online changes, low stock, work assignment and purchasing demand.
- Stakeholder resolution for operations managers, planners, asset owners/groups, assigned technicians, stores and procurement.
- In-app inbox with read state.
- Email outbox records with subject, recipient, body, time and status.

**Important:** this repository is still a static/offline-capable field build. The email outbox is intentionally labelled **Queued locally** and does not pretend an email was delivered. Real mail delivery requires a shared backend and email provider.

### Administration and security
- People, groups, manager relationships, roles and permission definitions.
- User activation/deactivation, MFA-enrolment visibility and email preferences.
- Site and store master records.
- Notification-rule configuration.
- Security policy configuration for MFA expectation, session timeout and audit retention.
- Audit trail for critical asset, stock, purchasing, security and administration actions.
- Explicit production boundary for SSO, IP restrictions, password policy and server-enforced RBAC.

## Run locally

```powershell
python3 -m http.server 8080 --directory dist
```

Open:

```text
http://localhost:8080
```

After pulling a new version, hard-refresh once so the service worker replaces the old cached shell.

## Recommended acceptance test

1. Open **Assets** and select `P-201` / Digester Feed Pump 02.
2. Return it online with a completion note and verify the downtime record closes, the asset log updates, and alerts are created.
3. Take it offline again with a reason and keep **Create a corrective work order** enabled.
4. Open **Work orders** and verify the new corrective WO exists.
5. Open **Parts & supplies**, select `MS-40-SS`, and issue one unit against the new WO.
6. Confirm the WO's actual parts consumption increases and the part stays on the purchase-planning board when below minimum.
7. Post a **Cycle count** with a variance and verify both count history and the stock transaction ledger.
8. Approve a request on **Purchase planning**, create a PO, then receive it from **Purchase orders** and confirm on-hand stock rises.
9. Open **Mail & alerts** and verify in-app messages, recipient resolution and the local email queue.
10. Open **People & groups**, **Roles & permissions**, **Audit trail**, and **Security** and verify configuration and audit events.
11. Disconnect networking after the app has loaded once and confirm the application shell remains available.

## Production boundary

This build is a strong single-device/offline prototype. Before organization-wide production use, add:

- Shared API and relational database
- Auth provider / server sessions
- Server-enforced RBAC and tenant/site scopes
- MFA and SSO enforcement
- Secure attachment storage
- Offline mutation queue and conflict resolution
- Real email and push delivery
- Server-side audit storage and retention
- Backups, monitoring and disaster recovery
- Device registration and data-at-rest protections

The UI does not claim those controls are active before the backend exists.
