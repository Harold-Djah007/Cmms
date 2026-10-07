# Email/password accounts and Gmail invitations

Status: opt-in implementation passes the backend account tests, including invitation acceptance, password resets and session invalidation. The full backend suite passes 62 tests. Actual Gmail delivery and access from another device remain unverified until a sender and reachable HTTPS host are configured. Native account MFA is not implemented.

Accounts use email and password, with web, mobile/field, or both access selected at invitation. Mobile means SafiMaintain's responsive web workspace, not a separate Android application. Roles still control operational permissions.

Invitations expire after seven days and can be revoked. Reissuing an invitation to the same address replaces its previous link after SMTP accepts the new message. Password reset links expire after 30 minutes; a successful reset invalidates existing sessions. Passwords and usable token values are never returned in workspace data.

## Gmail setup

Use `smtp.gmail.com`, port `587`, STARTTLS, your full sender email and a Google app password where your account policy permits it. Google requires 2-Step Verification for app passwords; some Workspace policies restrict them. Never enter your ordinary Gmail password into SafiMaintain or paste credentials into chat.

Google documentation: https://support.google.com/mail/answer/185833 and https://support.google.com/a/answer/9003945

In a local PowerShell terminal, configure these values before starting the backend:

```powershell
$env:SAFIMAINT_AUTH_MODE = 'password'
$env:SAFIMAINT_DEV_AUTH = 'false'
$env:SAFIMAINT_OWNER_EMAILS = 'your-owner-address@gmail.com'
$env:SAFIMAINT_PUBLIC_URL = 'http://127.0.0.1:8095'
$env:SMTP_HOST = 'smtp.gmail.com'
$env:SMTP_PORT = '587'
$env:SMTP_STARTTLS = 'true'
$env:SMTP_USERNAME = 'your-sender-address@gmail.com'
$env:SMTP_FROM = 'SafiMaintain <your-sender-address@gmail.com>'
$gmailSecret = Read-Host 'Google app password' -AsSecureString
$env:SMTP_PASSWORD = [System.Net.NetworkCredential]::new('', $gmailSecret).Password
python -m backend.app.accounts
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8095
```

The owner bootstrap prompts privately for the SafiMaintain password. It refuses to replace an existing owner account. Sign in at `/auth.html`, initialize your workspace if needed, then open People & groups → Manage live invitations. An initialized workspace and existing role are required before inviting a team member.

**Localhost email links work only on the computer running the server.** For invitations that recipients can actually open on other devices, use a reachable HTTPS address, set `SAFIMAINT_PUBLIC_URL` to that address, configure allowed hosts and persistent storage, and run behind HTTPS. Hosting is still a separate setup step. Do not expose the development server directly to the internet.

SMTP acceptance is shown as Sent; it does not establish delivery to the inbox. Failed delivery never creates a usable invitation link. Check spam and Google sending limits when diagnosing inbox delivery.

Run account checks before enabling this mode:

```powershell
python -m pytest -q backend/tests/test_accounts.py
```
