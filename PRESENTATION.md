# SafiMaintain board demonstration — October 7, 2026

## Start

Double-click **Start Demo.cmd**, or run `python scripts/run_demo.py` from this folder. The launcher picks an available port and opens the sample workspace. Keep its terminal open throughout the meeting. If the browser does not open automatically, copy the printed URL.

The presentation uses a separate browser storage key. Your operational workspace is preserved. All visible sample records are labeled as demo data. It needs Python and a browser, but no Docker, Node installation, internet, account or database server.

## Rehearse these steps on the presentation laptop

1. Start with **Maintenance dashboard**. Explain that the system brings overdue work, today's jobs, equipment attention and low-stock parts into one place. Click a measure to show its contributing work orders.
2. Open **WO-2502: Replace feed pump mechanical seal**. Show the related asset, checklist, assigned technicians and parts. This connects maintenance execution with equipment and inventory.
3. Open **Assets → All assets**, then the digester feed pump. Show its information, maintenance history and bill of materials. Return with the breadcrumb or Back button.
4. Open **Supplies → Parts & supplies**. Search for `seal`, open the mechanical seal and show stock quantities by location, receipts and supplier information. Switch Tree/List to demonstrate the two views.
5. Expand **Supplies** and click the count beside **Parts & supplies**. The dialog lists each part below minimum and opens its record. Open **Reorder list** to explain external replenishment.
6. Open **Maintenance → Scheduled maintenance**. Show recurring plans and their triggers. Explain that floating time plans advance after the linked work is completed.
7. If time permits, create a test work order, assign an asset and save it. Return to the dashboard and show the new job in the queue. Do this once in rehearsal before the meeting.

For the main presentation, show existing data first. Avoid changing stock or closing the demonstration's main job until its record has been shown. To reset samples, open the browser console and run `SafiMaintainDemo.load()`, then accept the confirmation. Resetting affects only the presentation workspace when using the launcher's URL.

## Suggested opening

“SafiMaintain brings work orders, preventive maintenance, assets and spare parts into one connected workspace. Our aim is the familiarity of established CMMS tools with fewer steps for our team. Today I will show how a maintenance need connects to equipment, assigned work and the parts required to complete it.”

## Explain the scope accurately

This presentation runs the implemented application with local sample data. It demonstrates the interface and operational workflows. It does not demonstrate multi-user server synchronization, enterprise sign-in, live SMTP delivery or shared attachments; those require the backend and configured services.

The repository includes a backend with permission checks, revision conflict handling and attachment storage. Production sign-in, SMTP credentials, backup infrastructure and deployment still require configuration and acceptance testing. Do not describe the device demo as a deployed production service or claim feature-for-feature Fiix parity.

Purchasing remains external: SafiMaintain maintains a reorder list rather than issuing purchase orders or RFQs.

## Interface reference

The redesign is informed by read-only inspection of the authenticated Safisana Fiix workspace on 7 October 2026. The command toolbars, location trees, record tabs and maintenance navigation use familiar CMMS patterns, with SafiMaintain's own teal/slate styling and simpler external purchasing workflow. See `FIIX_REFERENCE.md` for observations and scope limits.

## Before entering the room

- Open the demo and rehearse on the laptop you will use. Check the projector at the intended resolution and browser zoom.
- Keep the terminal open, connect the laptop charger and close unrelated browser tabs.
- Have the presentation ZIP extracted locally as a fallback. Its launcher also selects a free port.
- Keep the sample workspace clearly labeled; describe it as demonstration data.

## If something goes wrong

If the server window was closed, run the launcher again and use its new URL. If the browser is displaying an old version, press Ctrl+F5. If a previously edited sample workspace appears, use the reset procedure above. If the chosen browser fails to open, paste the printed URL into Chrome or Edge.
