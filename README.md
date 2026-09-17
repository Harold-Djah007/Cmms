# SafiMaintain CMMS

SafiMaintain is a computerized maintenance management system for Safisana operations. This build follows the Fiix CMMS product model: work orders, scheduled maintenance, assets, parts & supplies, purchasing and analytics as linked records — not a field-only task board.

The information architecture matches how Fiix organizes maintenance:

- **Dashboards** — active work, late work, priority, user workload, scheduled compliance, MTTR, offline assets and low stock
- **Maintenance** — work orders, my work, scheduled maintenance, work requests, calendar
- **Assets** — region → site → facility → equipment → tools, meters, tool crib
- **Inventory** — parts catalog, purchase planning board, purchase orders, RFQs, vendors, receipts, cycle counts
- **Analytics** — compliance, cost and backlog KPIs
- **Administration** — users & groups, notifications, lookup tables, audit trail, security

## What this build now does

### Work orders (Fiix work-order record)

- Full-page work order with Summary, Completion, Labor tasks, Parts, Costs, Additional details, Files and Work log
- Fields: summary of issue, asset, additional asset, maintenance type, priority, assigned user, suggested start, suggested completion, estimated time, project, instructions
- Statuses: Open → On Hold → In Progress → Completed → Closed
- Maintenance types: Preventive, Corrective, Inspection, Emergency, General
- Labor tasks: general, inspection (Pass / Fail / N/A) and meter reading, with hours spent
- Failed inspections can create a corrective follow-on work order
- Parts issue uses FIFO lots and reduces on-hand stock
- Labor is costed from the assigned user’s hourly rate
- Miscellaneous costs roll into the work-order total and asset TCO
- Problem / cause / action failure codes
- Closing without notes auto-fills “Completed by {user}”, as in Fiix

### Scheduled maintenance

- Time, meter and event triggers
- Fixed vs floating scheduling
- Nested PMs (weekly + monthly task groups on one SM)
- Skip auto-generation while a child work order is still open
- Generate work order now, without advancing the next trigger
- SM record tabs: Details, Scheduling, Labor tasks, Parts, Nested PMs, Log

### Work request portal

- Submit, approve, decline or convert a request to a corrective work order
- Requesters can be tracked by name and status

### Assets

- Hierarchy: region → site → facility → equipment → tools
- Online / Offline availability with a required downtime reason
- Offline transitions can create corrective work and fire event-based scheduled maintenance
- Nameplate, assigned user, preferred vendor, warranties, BOM, meters, work history, downtime log and TCO

### Inventory and purchasing

- Parts catalog with stock locations, min/max, preferred vendor and reorder quantity
- Automatic purchase requests on the **purchase planning board** when stock falls to or below minimum
- Convert a planning-board row to a PO or RFQ
- Purchase-order lifecycle: Draft → Approved → Ordered → Received, optionally linked to a work order
- Receiving a PO posts a receipt, FIFO lot and on-hand quantity
- Cycle counts with expected / counted / variance
- Tool crib check-in / check-out

### Also included

- Resource calendar of suggested completion dates
- QR / barcode record lookup
- Offline-capable PWA shell and device-local persistence
- Users, hourly rates, certification flags, notifications, lookup tables, audit trail and security policy

## Run locally

```powershell
python3 -m http.server 8080 --directory dist
```

Open:

```text
http://localhost:8080
```

After pulling a new version, hard-refresh the browser once so the PWA cache updates.

## Recommended test

1. Open **Dashboard** and confirm active, late, type, user and priority widgets.
2. Open **Work orders** and click `WO-2407` — it must open as a full record, not a side drawer.
3. On **Labor tasks**, complete the general tasks, record the meter reading, and **Fail** the mechanical-seal inspection. Confirm a corrective follow-on work order is created.
4. On **Parts**, issue a planned spare. Confirm stock drops on **Parts catalog** and a row appears on the **Purchase planning board** if the part is at minimum.
5. Log labor on **Costs** and complete / close the work order.
6. Open **Scheduled maintenance → PM-101**. Review nested PMs, then **Generate work order now**.
7. Open **All assets**, walk West Africa → Safisana Ghana Ltd → Operations → Mix Pit → Digester Feed Pump 02. Take the pump offline with a downtime reason.
8. Open **Work requests**, submit a request, approve it and convert it to a work order.
9. Create a vendor and draft purchase order, approve, order, receive, and confirm stock increases.
10. Turn networking off and confirm the app still opens after it has been loaded once online.

## Production boundary

This is a strong single-device CMMS build, not yet a shared multi-user deployment. The UI does not pretend local data has synchronized to a server.

The next platform milestone should add:

- Shared backend API and database
- Server-enforced authentication and role permissions
- Offline-to-server synchronization and conflict handling
- Shared photo/file storage
- Server-side audit history
- External mail-provider delivery and push notifications
- Production QR label generation
- Central backup, monitoring and recovery
