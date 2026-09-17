# SafiMaintain CMMS

SafiMaintain is a field-first maintenance management product for Safisana operations.

This redesign is based on CMMS workflow patterns rather than copied screenshots. It uses SafiMaintain's own navigation, visual system and field workflow while implementing the maintenance behaviors expected from mature CMMS products.

## What this build now does

- Asset hierarchy: site → facility → equipment → tools
- Working asset creation, editing, hierarchy moves, responsibility and equipment metadata
- Independent Online / Offline operational state with a required reason and state history
- Offline transitions can create a corrective work order automatically
- Asset-state stakeholder alerts for operations managers, planners, responsible people and active work assignees
- Asset details with status, criticality, location, meters, PM, work history and BOM parts
- Work-order lifecycle: Open → In Progress → Completed
- Work-order tasks, labor, parts and activity history
- General, inspection and meter-reading task types
- Configured failed inspections can create corrective follow-on work
- Preventive maintenance with time and meter triggers
- Fixed and floating PM scheduling behavior
- Manual PM work-order generation
- Maintenance requests that can be triaged into corrective work orders
- Parts stock by physical store/bin location
- Expandable Supplies navigation with Parts & Supplies, Stock Receipts, Cycle Counts, Purchase Orders and Suppliers
- Working stock receipt flow that increases the selected part at the selected store/bin
- Working cycle counts with expected quantity, counted quantity and posted variance
- Stock variance and below-minimum alerts with in-app notifications and email-copy records
- Simple purchase-order lifecycle: Draft → Approved → Ordered → Received
- Receiving a purchase order automatically creates a receipt and updates on-hand stock
- Working part and supplier creation forms
- Issuing parts to a work order reduces actual stock
- Meter readings can trigger maintenance plans
- QR/barcode record lookup where the browser supports camera scanning
- Manual tag lookup fallback
- Offline-capable PWA shell and device-local persistence
- Responsive field UI for desktop, tablet and phone
- People and role administration, activation, MFA visibility and email preferences
- Mail & Alerts center with announcements, read state and a transparent local email outbox
- Security policy controls and a traceable audit trail for critical changes

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

1. Open **Asset register** and navigate through Safisana Ghana → Operations → Mix Pit → Digester Feed Pump 02.
2. Open **Work orders** and select `WO-2407`.
3. Start the work order.
4. Complete the general tasks.
5. Record its meter-reading task.
6. Fail the mechanical-seal inspection and verify that a corrective follow-on work order is created.
7. Open **Parts** inside the work order and issue a planned spare.
8. Confirm the stock level drops in **Supplies → Parts & supplies**.
9. Log technician labor.
10. Complete the remaining tasks and close the work order.
11. Open **Preventive maintenance** and test **Generate now**.
12. Add a meter reading and evaluate PM triggers.
13. Turn networking off and confirm the app still opens after it has been loaded once online.
14. Open **Asset register**, take an asset offline with a reason and verify the event, corrective work order and alerts.
15. Open **Supplies**, post a cycle count with a variance and verify stock and alert history.
16. Open **Mail & alerts**, review the in-app alert and prepared email copy.
17. Open **People & access**, **Audit trail** and **Security** to review administration controls.

## Production boundary

This is a strong single-device field build, not yet a shared multi-user deployment. The UI deliberately does not pretend local data has synchronized to a server.

The next platform milestone should add:

- Shared backend API and database
- Server-enforced authentication and role permissions
- Offline-to-server synchronization and conflict handling
- Shared photo/file storage
- Server-side audit history
- External mail-provider delivery and push notifications
- Production QR label generation
- Central backup, monitoring and recovery

## Development branch

```text
feature/cmms-product-redesign
```
