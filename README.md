# SafiMaintain CMMS

SafiMaintain is an offline-first maintenance management system inspired by the practical workflows found in modern CMMS products, while using its own design and implementation.

## Field-ready 8/10 milestone

This branch upgrades the original pilot into a stronger single-device field build:

- Operations dashboard with urgent, overdue, downtime, and stock signals
- Work orders with create, search, filter, start, and complete workflow
- Equipment health, locations, and service dates
- Preventive maintenance schedule
- Spare-parts stock and reorder warnings
- Field inspections with required checklists, notes, due dates, and local inspection history
- Offline caching through a service worker
- Installable PWA behavior for phones, tablets, and desktops
- Local persistence so work survives refreshes and temporary loss of connectivity
- JSON backup export **and restore**
- Responsive UI designed for technicians and operations managers
- Accessible controls, focus states, reduced-motion support, and large mobile touch targets

## Run locally

```bash
python3 -m http.server 8080 --directory dist
```

Open <http://localhost:8080>.

For testing from another device on the same Wi-Fi network:

```bash
python3 -m http.server 8080 --bind 0.0.0.0 --directory dist
```

Then open `http://YOUR-COMPUTER-IP:8080` from the phone or tablet.

## Suggested field test

1. Install SafiMaintain from the browser when the install option appears.
2. Create a work order.
3. Start the job, then complete it.
4. Run one of the field inspections and save notes.
5. Turn off Wi-Fi/mobile data and repeat a work-order or inspection workflow.
6. Reopen the app and confirm records remain.
7. Export a backup from **Reports**.
8. Test **Restore backup** with the exported JSON file.

## Why this is not yet a production 10/10

This release is intentionally serverless and stores operational data in the browser on the current device. That makes it useful for offline field evaluation, but an organization-wide rollout still needs:

- Shared backend database and API
- User authentication and role permissions
- Device-to-server sync and conflict handling
- Multi-user audit trail
- Photo/file attachments and compression
- Push/email/WhatsApp notifications
- QR/barcode asset scanning
- Inventory transactions and purchasing workflow
- Automated preventive-maintenance work-order generation
- Cloud backups, monitoring, security hardening, and recovery tests

Those are the next milestone after the field workflow is validated.
