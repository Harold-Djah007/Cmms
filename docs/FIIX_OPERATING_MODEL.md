# SafiMaintain — Fiix-aligned CMMS operating model

This document is the implementation blueprint for SafiMaintain. It is based on Fiix's public product material and help guides, but SafiMaintain keeps its own branding, workflows and implementation.

## 1. Core CMMS loop

SafiMaintain should behave as one connected maintenance system rather than separate pages:

1. Assets are organized in a parent/sub-asset hierarchy.
2. Requests and preventive triggers create work.
3. Work orders contain tasks, assignees, instructions, notes, parts usage, failure data, files and history.
4. Taking an asset offline creates downtime context and can create corrective work.
5. Parts issued to work reduce stock and contribute to maintenance cost/history.
6. Low stock creates purchasing demand.
7. Purchase requests become purchase orders and receipts replenish inventory.
8. Meter readings and scheduled maintenance generate preventive work.
9. Notifications surface assignments, asset state and inventory events.
10. Audit/history records who changed what and when.
11. Dashboards and reports summarize work, downtime, reliability and stock risk.
12. Field/mobile workflows must remain usable offline.

## 2. Asset management

### Hierarchy browser

The primary asset list is a full-width expandable hierarchy table with columns for asset/location, description, code, work and state. It supports:

- parent and sub-assets
- expand/collapse
- filtering by facility/equipment/tool
- search by code, name, description or location
- drag-and-drop re-parenting
- top-level assets
- cloning
- CSV import
- online/offline state
- asset identification tag

The site/workspace is context, not an artificial maintainable root asset.

### Asset record

Opening an asset leaves the hierarchy list and opens a dedicated master record with:

- asset identity/nameplate
- description
- code/category/location
- parent and sub-assets
- responsible person/group
- online/offline state
- General tab
- Parts/BOM tab
- Metering/Events tab
- Personnel tab
- Work History tab
- Files tab
- Financials tab
- Log tab

All asset edits must persist to local storage, reload from storage, and repaint from the persisted record.

## 3. Work management

Work orders are execution records, not just rows in a list. A work order includes:

- linked asset(s)
- status and priority
- due date
- assigned people
- instructions
- tasks with completion state
- planned/issued parts
- work/completion notes
- problem/cause/action failure codes
- chronological work log/history

Rules:

- completed work requires all tasks to be complete
- task changes create history and audit events
- Quick Complete may close all tasks, but still records who did it
- parts can be issued against a work order
- asset links open the master asset record

## 4. Preventive maintenance

Scheduled maintenance supports:

- date/time triggers
- meter triggers
- event/alarm-oriented triggers when integrations are available
- task templates
- required parts
- automatic work-order generation
- upcoming-work notifications

## 5. Requests

Operators can submit requests with:

- asset
- description/summary
- urgency
- requester identity
- optional attachments when file storage is available

Maintenance can triage and convert a request into a work order while retaining source history.

## 6. Inventory, parts and purchasing

Parts records include:

- part number and description
- category/UOM
- stock by store/bin
- min/max/reorder quantity
- preferred vendor
- price/cost basis
- barcode/QR value
- asset BOM relationships
- transaction history

Stock workflows include:

- receipt
- issue
- transfer
- adjustment
- cycle counts
- issue-to-work-order
- low-stock alerts
- automatic purchase demand

Purchasing follows:

Purchase request -> approval -> purchase order -> partial/full receipt -> stock update -> closed demand.

## 7. Downtime and reliability

Asset online/offline changes create history. Offline events include reason, start/end, linked corrective work and duration. Reporting should expose:

- active offline assets
- downtime hours
- MTTR
- recurring failures
- overdue work
- PM compliance
- work mix
- low-stock risk

## 8. Notifications

Notification rules can target:

- assigned technicians
- maintenance planners
- operations managers
- asset owners/groups
- storekeepers
- procurement users

Channels are represented as in-app and queued email in the current local prototype. Production email/push delivery requires a backend provider.

## 9. Administration and security

Production field readiness requires server-enforced:

- authentication
- role-based permissions
- tenant/site isolation
- audit retention
- MFA/SSO where configured
- centralized synchronization
- backup and recovery

The browser-only prototype may demonstrate these workflows but must not falsely claim server-side security.

## 10. Offline/mobile

Field operations must support:

- cached application shell
- asset lookup offline
- work-order execution offline
- task completion offline
- meter readings offline
- stock/cycle-count capture offline
- queued synchronization when a backend is connected

## Current implementation status

Implemented in the current SafiMaintain prototype:

- parent/sub-asset hierarchy
- hierarchy search/filter/expand/collapse
- drag-and-drop asset re-parenting
- clone and CSV import
- separate asset master-record workspace
- online/offline + downtime + corrective-work link
- work orders + tasks + parts + history
- failure-code capture
- preventive maintenance templates/generation
- requests -> work orders
- meters
- parts/stores/transactions/transfers
- cycle counts
- low-stock purchase demand
- purchase requests / POs / receiving
- vendors and tool crib
- notification rules / in-app alerts / queued mail
- audit history
- reports/reliability views
- local-first service-worker caching

Production gaps remain backend synchronization, true multi-user concurrency, file storage, real email/push delivery, and server-enforced authentication/authorization.
