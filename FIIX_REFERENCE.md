# Live workspace reference

## Current rebuild target — 7 October 2026

The user has superseded the earlier simplification scope: reproduce the full observed Fiix interface and workflows first, then review what to remove. Screenshots are supporting context, not acceptance criteria. Acceptance must be based on direct inspection of the authenticated workspace and tested SafiMaintain workflows. Preserve existing SafiMaintain workspace data during the rebuild.

Fiix's official public GitHub organization (https://github.com/fiixlabs) publishes API clients and integration examples. This search did not locate the CMMS application's source code. Public API documentation (https://fiixlabs.github.io/api-documentation/) is a reference for domain concepts, not application source or evidence of implemented parity.

During the latest live inspection, Purchasing expanded to Purchase Planning Board, Purchase Orders, Receipts and RFQs. The user renewed the expired session. Purchase Planning Board groups requests by supplier and exposes quantity, unit price, required date, quotes, account and charge department, with quote requests and PO generation. The PO register shows code, supplier, line items, received percentage, total, expected delivery, status and site. No Fiix purchase or account records were modified.

The Users screen was inspected directly, including Account Details and Access Control. It provides search and site/group/status/system-role filters, missing-group detection and column customization. Account Details separates identity, job details, managers and contact details. Access Control separates groups and system roles. These observations are structural; company user records have not been copied into SafiMaintain.

Implemented and verified in this pass: compact gray navigation; fuller parts and work registers with sorting, pagination and customizable columns; compact scheduled-maintenance register with existing edit/pause/generation actions; searchable/filterable user directory with profile editing; asset completion trends; and restored purchasing and analytics navigation. Account email is read-only in profile editing to avoid diverging from authentication identities. Parts hierarchy counts unique part records rather than counting a part twice when stored in two locations.

Verification now covers 38 routes at desktop and mobile widths, numeric parts sorting, column customization, user profile saving, restricted-user register access, scheduling/filtering, and a demo PO through approval, ordering, partial receipt and final receipt. Two receipt records and the exact stock increase are asserted. Existing work completion, atomic stock issuing and offline checks also pass. All 21 frontend regressions pass.

Outstanding work includes deeper purchasing-planning/RFQ parity, dashboard configuration, complete asset/work/user record-editor parity, work insights, full administration settings, and continued direct inspection of reports and analytics. Unintegrated draft fragments in `.test-tmp` are not completed features. These changes do not establish full Fiix parity or production readiness.

Reviewed the authenticated Safisana Fiix workspace on 7 October 2026 with the user's authorization. The observations below describe interface patterns, not a copy of company records or Fiix assets.

- Navigation: persistent compact sidebar; one expanded group; child destination highlighted; Dashboard, Maintenance, Notifications, Assets, Supplies, Purchasing, Reports, Analytics, Settings.
- Dashboard: operational measures alongside a work backlog; site scope and work timing filters. Counts drill into work rather than serving as decoration.
- Registers: command toolbar, page title, category/status filter, tree/list switch where applicable, search, sortable table and record count/pagination. Selected rows are distinct from opening a record.
- Parts: location hierarchy or one row per part. Name, code, total stock and stock-location fields. Part record header contains identity and stock summary. Stock tab places location balances and receipts on the left, account/barcode/make/model/price metadata on the right. Other tabs include cycle count, BOMs, personnel, warranties, businesses, files, custom and log.
- Assets: facilities, equipment and tools; compact identity/status header; General, Parts/BOM, Metering/Events, Personnel, Files, Custom, Log. Facility location distinguishes a parent facility from a standalone address.
- Work orders: default active status filter, description, priority, assets, assignments, status, type, task status and labor columns. Maintenance also contains scheduled maintenance, task groups and projects.

Scope still to inspect: detailed scheduling, completion, purchasing approval, reports, analytics and administration. No records were saved, imported or deleted during this review. An unexpected delete confirmation was cancelled immediately.

SafiMaintain now has a replacement presentation layer in `dist/assets/safimaint-rebuild.js` and a single active design system in `dist/assets/safimaint-rebuild.css`. The dashboard, asset hierarchy, parts hierarchy/list and work-order register are newly rendered. Supporting screens and record editors retain their domain actions and use the new design system. Historical stylesheet links are inactive; their files remain for compatibility and reference.

The redesign uses a compact slate navigation, teal actions, command toolbars, readable tables, record tabs and location-aware trees. Parts open beneath expanded stock locations by default. Notification badges beside child destinations open the contributing records without inserting alerts into the navigation. Parts and asset selections support CSV export. Existing workspace data is preserved.

Verification covers 31 routes at desktop and mobile widths, one active destination, dashboard filters, record opening, draft preservation, request triage, work creation/completion, preventive scheduling, atomic stock issuing, offline reload and isolated demonstration persistence. These checks do not establish full Fiix parity or certify production readiness.
