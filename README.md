# SafiMaintain CMMS

SafiMaintain is a field-first maintenance management product for Safisana operations.

This redesign is based on CMMS workflow patterns rather than copied screenshots. It uses SafiMaintain's own navigation, visual system and field workflow while implementing the maintenance behaviors expected from mature CMMS products.

## What this build now does

- Asset hierarchy: site → facility → equipment → tools
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
- Issuing parts to a work order reduces actual stock
- Meter readings can trigger maintenance plans
- QR/barcode record lookup where the browser supports camera scanning
- Manual tag lookup fallback
- Offline-capable PWA shell and device-local persistence
- Responsive field UI for desktop, tablet and phone

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
8. Confirm the stock level drops in **Parts & stores**.
9. Log technician labor.
10. Complete the remaining tasks and close the work order.
11. Open **Preventive maintenance** and test **Generate now**.
12. Add a meter reading and evaluate PM triggers.
13. Turn networking off and confirm the app still opens after it has been loaded once online.

## Production boundary

This is a strong single-device field build, not yet a shared multi-user deployment. The UI deliberately does not pretend local data has synchronized to a server.

The next platform milestone should add:

- Shared backend API and database
- Authentication and role permissions
- Offline-to-server synchronization and conflict handling
- Shared photo/file storage
- Server-side audit history
- Notifications
- Production QR label generation
- Purchasing and procurement
- Central backup, monitoring and recovery

## Development branch

```text
feature/cmms-product-redesign
```
