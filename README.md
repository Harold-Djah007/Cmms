# SafiMaintain CMMS

SafiMaintain is an accessible, offline-capable maintenance management pilot for work orders, equipment, preventive maintenance, spare parts, and operational reporting.

## Run locally

```bash
python3 -m http.server 8080 --directory dist
```

Open <http://localhost:8080>.

## What works in this pilot

- Dashboard for urgent and overdue maintenance
- Create, search, filter, and complete work orders
- Equipment health and service dates
- Preventive maintenance schedule
- Spare-parts stock and reorder warnings
- Offline caching and installable PWA support
- Device-local saved data and JSON backup export
- Responsive design for desktop, tablet, and mobile

## Important pilot limitation

Records are stored in the current browser on the current device. A production rollout should add a shared server database, user accounts and roles, audit history, attachments, notifications, and tested backup/restore procedures.
