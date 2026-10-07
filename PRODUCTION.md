# Production setup and acceptance

The repository is prepared for a single API worker behind Microsoft Entra / Azure App Service Authentication. The local board demonstration uses isolated sample data. It does not validate live authentication, SMTP, hosting or disaster recovery in your chosen environment.

## Configure the deployment

1. Build `backend/Dockerfile`. Python 3.12 dependencies are pinned in `backend/requirements.lock`; CI audits them for known vulnerabilities.
2. Use `.env.production.example` as the configuration checklist. Replace hostnames and email addresses with real values and supply secrets through your hosting provider's secret settings. Do not commit secrets.
3. Require Entra sign-in for every application/API route and enforce your organization's MFA and access policies. Verify the authentication layer strips caller-supplied identity headers. Keep direct container access private.
4. Mount durable encrypted storage at `/app/data`. Use one API worker and one instance with SQLite. The application is not configured for multiple database writers across hosts.
5. Configure the real SMTP relay with STARTTLS. Confirm an alert reaches a test recipient, then confirm the mail queue records delivery.
6. Probe `/api/ready` through the configured production hostname. A ready response checks database integrity and writable attachment storage. Alert on failures, server errors, storage usage and failed/queued mail. Logs include request IDs without request bodies or query strings.

Production startup refuses development authentication, missing trusted-auth configuration, default hosts/owners and relative storage paths. These checks validate settings; your authentication provider must still be tested.

## Backup and recovery

Run from the project directory with access to the persistent data volume. Choose a unique backup filename:

```powershell
python scripts/backup_restore.py backup --database data/safimaint.db --attachments data/attachments --archive backups/safimaint-2026-10-07.zip
python scripts/backup_restore.py verify --archive backups/safimaint-2026-10-07.zip
python scripts/backup_restore.py restore --archive backups/safimaint-2026-10-07.zip --destination recovery/rehearsal-2026-10-07
```

For production, substitute the real mounted paths. The backup holds a database write lock while creating a consistent database and attachment snapshot. Schedule during a quiet period. Backups contain operational data: encrypt them, restrict access and copy them off the application host. Schedule daily backups and set retention to your organization's requirements.

Restore requires a new destination and verifies every file's SHA-256 checksum plus database integrity. It will not overwrite an existing workspace. During a recovery drill, start an isolated API against the recovered database and attachments, inspect a work order, inventory balances and an attachment, and record elapsed recovery time. Before a real recovery, stop writes, preserve the original volume, then point the deployment at the verified recovered paths.

## Go-live evidence

Before approving live use, record evidence that unauthenticated requests fail; a viewer cannot edit; a technician can complete assigned work; an owner can administer roles; caller identity headers cannot bypass sign-in; two concurrent edits produce a conflict without losing data; attachments survive a restart; an actual SMTP message arrives; and an off-host backup restores successfully. Rehearse your site's normal work-order, PM, stock-issue and cycle-count workflows with real users.

Record the approved hostname, owner, backup operator, monitoring contacts, recovery time and data-loss target. Repository tests cannot certify these live operational controls. Larger deployments need a managed database, object storage and a durable mail worker before scaling beyond this single-instance design.
