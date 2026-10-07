"""Opt-in first-party accounts. Passwords, tokens and sessions never enter client state."""
from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import smtplib
import ssl
import time
import uuid
from contextlib import closing
from datetime import datetime, timezone
from email.message import EmailMessage
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field

from .config import settings
from .database import connect, transaction
from .security import Identity, demand, permission_set, require_identity

router = APIRouter(prefix="/api/auth", tags=["Accounts"])
COOKIE = "safimaint_session"

def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()

def password_hash(password: str) -> str:
    if len(password) < 12 or len(password) > 128:
        raise HTTPException(422, "Use a password between 12 and 128 characters")
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 600_000)
    return f"pbkdf2_sha256$600000${salt}${key.hex()}"

def password_matches(password: str, encoded: str) -> bool:
    try:
        _, rounds, salt, expected = encoded.split("$")
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(rounds)).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False

def email_address(value: str) -> str:
    value = value.strip().lower()
    if len(value) > 254 or value.count("@") != 1 or any(c.isspace() for c in value) or any(c in value for c in "<>\r\n"):
        raise HTTPException(422, "Enter a valid email address")
    if not all(value.split("@")):
        raise HTTPException(422, "Enter a valid email address")
    return value

def enabled():
    if settings.auth_mode != "password":
        raise HTTPException(409, "Email/password accounts are not enabled. Configure SAFIMAINT_AUTH_MODE=password.")

def throttle(request: Request, purpose: str, email: str = ""):
    # Persistent, hashed rate-limit keys work across restarts without recording email/IP.
    keys = [(f"{purpose}:ip:{request.client.host if request.client else 'unknown'}", 60)]
    if email:
        keys.append((f"{purpose}:email:{email}", 10))
    blocked = False
    with transaction() as db:
        now = time.time()
        db.execute("DELETE FROM account_attempts WHERE started<?", (now - 900,))
        for key, limit in keys:
            bucket = digest(key)
            db.execute("INSERT INTO account_attempts VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET count=count+1", (bucket, now))
            if db.execute("SELECT count FROM account_attempts WHERE bucket=?", (bucket,)).fetchone()[0] > limit:
                blocked = True
    if blocked:
        raise HTTPException(429, "Too many attempts. Try again in 15 minutes.")

def workspace(db):
    row = db.execute("SELECT * FROM workspaces WHERE id='default'").fetchone()
    return (json.loads(row["state_json"]), row) if row else (None, None)

def session_identity(request: Request) -> Identity:
    raw = request.cookies.get(COOKIE, "")
    with closing(connect()) as db:
        row = db.execute("SELECT a.* FROM account_sessions s JOIN accounts a ON a.email=s.email WHERE s.hash=? AND s.expires>?", (digest(raw), time.time())).fetchone() if raw else None
        state, _ = workspace(db)
    if not row:
        raise HTTPException(401, "Sign-in is required")
    user = next((u for u in (state or {}).get("users", []) if str(u.get("email", "")).lower() == row["email"]), None)
    if user and not user.get("active"):
        raise HTTPException(401, "This account has been disabled")
    if not user and row["email"] not in settings.owner_emails:
        raise HTTPException(401, "This account no longer has workspace access")
    return Identity(row["email"], row["email"], row["name"], "password")

def admin(identity: Identity = Depends(require_identity)):
    enabled()
    with closing(connect()) as db:
        state, _ = workspace(db)
    demand(permission_set(state, identity), {"admin.people"})
    return identity

def mail_link(email: str, token: str, kind: str):
    parsed = urlsplit(settings.public_url)
    if not settings.smtp_host or not parsed.hostname or parsed.scheme not in {"http", "https"} or parsed.query or parsed.fragment or parsed.username:
        raise HTTPException(503, "Configure SMTP and SAFIMAINT_PUBLIC_URL before sending invitations or password resets")
    if settings.environment == "production" and (parsed.scheme != "https" or not settings.smtp_starttls):
        raise HTTPException(503, "Secure email delivery is not configured")
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = email
    message["Subject"] = "Your SafiMaintain invitation" if kind == "invite" else "Reset your SafiMaintain password"
    hours = "7 days" if kind == "invite" else "30 minutes"
    message.set_content(f"Open this link to {'join SafiMaintain and set your password' if kind == 'invite' else 'choose a new password'}:\n\n{settings.public_url}/auth.html#{kind}={token}\n\nThis link can be used once and expires in {hours}. If you did not expect this email, ignore it. Never share this link.")
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            if settings.smtp_starttls:
                smtp.starttls(context=ssl.create_default_context())
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            if smtp.send_message(message):
                raise OSError("Recipient refused")
    except (OSError, smtplib.SMTPException, ValueError) as error:
        raise HTTPException(502, "The email service did not accept this message. Check email configuration and retry.") from error

def issue(email: str, kind: str, payload: dict):
    raw = secrets.token_urlsafe(32)
    hashed = digest(raw)
    with transaction() as db:
        db.execute("INSERT INTO account_tokens VALUES(?,?,?,?,?,0,'Pending')", (hashed, kind, email, json.dumps(payload), time.time() + (604800 if kind == "invite" else 1800)))
    try:
        mail_link(email, raw, kind)
    except HTTPException:
        with transaction() as db:
            db.execute("UPDATE account_tokens SET used=1,status='Failed' WHERE hash=?", (hashed,))
        raise
    with transaction() as db:
        db.execute("UPDATE account_tokens SET used=1,status='Replaced' WHERE email=? AND kind=? AND hash<>? AND used=0", (email, kind, hashed))
        db.execute("UPDATE account_tokens SET status='Sent' WHERE hash=?", (hashed,))
    return {"status": "Sent", "message": "Email accepted by the mail service"}

class Login(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)
    accessKind: str = "web"

class Email(BaseModel):
    email: str = Field(max_length=254)

class Invite(Email):
    name: str = Field(min_length=1, max_length=120)
    roleId: str = Field(max_length=100)
    accessKind: str = "both"
    siteIds: list[str] = Field(default_factory=list, max_length=100)
    groupIds: list[str] = Field(default_factory=list, max_length=100)

class Redeem(BaseModel):
    token: str = Field(min_length=20, max_length=100)
    password: str = Field(min_length=12, max_length=128)

@router.get("/config")
def config():
    return {"mode": settings.auth_mode, "emailConfigured": bool(settings.smtp_host and settings.public_url)}

@router.post("/login")
def login(payload: Login, request: Request, response: Response):
    enabled()
    email = email_address(payload.email)
    throttle(request, "login", email)
    with closing(connect()) as db:
        row = db.execute("SELECT * FROM accounts WHERE email=?", (email,)).fetchone()
    # Spend the same hashing work for unknown addresses to reduce enumeration.
    encoded = row["password_hash"] if row else "pbkdf2_sha256$600000$" + "00" * 16 + "$" + "00" * 32
    if not password_matches(payload.password, encoded) or not row:
        raise HTTPException(401, "Email or password is incorrect")
    with closing(connect()) as db:
        state, _ = workspace(db)
    user = next((u for u in (state or {}).get("users", []) if str(u.get("email", "")).lower() == email), None)
    if user and (not user.get("active") or payload.accessKind not in {"web", "mobile"} or user.get("accessKind", "both") not in {"both", payload.accessKind}):
        raise HTTPException(403, "Your account does not have access to this workspace mode")
    if not user and email not in settings.owner_emails:
        raise HTTPException(403, "This account no longer has workspace access")
    raw = secrets.token_urlsafe(32)
    with transaction() as db:
        db.execute("DELETE FROM account_sessions WHERE expires<?", (time.time(),))
        db.execute("INSERT INTO account_sessions VALUES(?,?,?)", (digest(raw), email, time.time() + 43200))
    response.set_cookie(COOKIE, raw, max_age=43200, httponly=True, secure=settings.environment == "production", samesite="lax", path="/")
    return {"status": "Signed in"}

@router.post("/logout")
def logout(request: Request, response: Response):
    with transaction() as db:
        db.execute("DELETE FROM account_sessions WHERE hash=?", (digest(request.cookies.get(COOKIE, "")),))
    response.delete_cookie(COOKIE, path="/")
    return {"status": "Signed out"}

@router.post("/invitations")
def invite(payload: Invite, request: Request, identity: Identity = Depends(admin)):
    email = email_address(payload.email)
    throttle(request, "invite")
    if payload.accessKind not in {"web", "mobile", "both"}:
        raise HTTPException(422, "Choose web, mobile or both")
    with closing(connect()) as db:
        state, _ = workspace(db)
        if not state or not any(r["id"] == payload.roleId for r in state.get("roles", [])):
            raise HTTPException(422, "Choose an existing workspace role")
        for field, collection in (("siteIds", "sites"), ("groupIds", "groups")):
            if not set(getattr(payload, field)).issubset({x["id"] for x in state.get(collection, [])}):
                raise HTTPException(422, "Unknown site or group")
        if db.execute("SELECT 1 FROM accounts WHERE email=?", (email,)).fetchone():
            raise HTTPException(409, "This user already has an account. Use password reset or edit their workspace role.")
    return issue(email, "invite", payload.model_dump() | {"email": email, "invitedBy": identity.email})

@router.get("/invitations")
def invitations(identity: Identity = Depends(admin)):
    with closing(connect()) as db:
        rows = db.execute("SELECT hash,email,payload,expires,used,status FROM account_tokens WHERE kind='invite' ORDER BY expires DESC LIMIT 200").fetchall()
    return [{"id": r["hash"], "email": r["email"], "name": json.loads(r["payload"]).get("name", ""), "accessKind": json.loads(r["payload"]).get("accessKind", "both"), "status": "Expired" if not r["used"] and r["expires"] < time.time() else r["status"]} for r in rows]

@router.delete("/invitations/{identifier}")
def revoke(identifier: str, identity: Identity = Depends(admin)):
    with transaction() as db:
        db.execute("UPDATE account_tokens SET used=1,status='Revoked' WHERE hash=? AND kind='invite' AND used=0", (identifier,))
    return {"status": "Revoked"}

@router.post("/forgot")
def forgot(payload: Email, request: Request):
    enabled()
    email = email_address(payload.email)
    throttle(request, "reset", email)
    if not settings.smtp_host or not settings.public_url:
        raise HTTPException(503, "Password reset email is not configured")
    with closing(connect()) as db:
        exists = db.execute("SELECT 1 FROM accounts WHERE email=?", (email,)).fetchone()
    if exists:
        try:
            issue(email, "reset", {})
        except HTTPException:
            # Do not disclose whether an address exists through delivery errors.
            pass
    return {"message": "If this address has an account, a password reset email will be sent. Check your inbox and spam folder."}

@router.post("/redeem/{kind}")
def redeem(kind: str, payload: Redeem, request: Request):
    enabled()
    throttle(request, "redeem")
    if kind not in {"invite", "reset"}:
        raise HTTPException(404, "Unknown link")
    encoded_password = password_hash(payload.password)
    with transaction() as db:
        token = db.execute("SELECT * FROM account_tokens WHERE hash=? AND kind=? AND used=0 AND status='Sent' AND expires>?", (digest(payload.token), kind, time.time())).fetchone()
        if not token:
            raise HTTPException(400, "This link is invalid, expired or already used. Request a new email.")
        email = token["email"]
        if kind == "invite":
            details = json.loads(token["payload"])
            state, previous = workspace(db)
            if not state or not any(r["id"] == details["roleId"] for r in state.get("roles", [])):
                raise HTTPException(409, "The assigned role no longer exists. Ask your administrator for a new invitation.")
            if db.execute("SELECT 1 FROM accounts WHERE email=?", (email,)).fetchone():
                raise HTTPException(409, "Account already exists. Sign in or reset your password.")
            user = next((u for u in state.get("users", []) if str(u.get("email", "")).lower() == email), None)
            if user is None:
                user = {"id": "U-" + uuid.uuid4().hex}
                state["users"].append(user)
            user.update({k: details[k] for k in ("email", "name", "roleId", "accessKind", "siteIds", "groupIds")})
            user.update(active=True, mfaEnabled=False)
            from .validation import validate_state
            validate_state(state)
            timestamp = datetime.now(timezone.utc).isoformat()
            encoded = json.dumps(state, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
            state_hash = digest(encoded)
            revision = previous["revision"] + 1
            db.execute("INSERT INTO state_history VALUES(?,?,?,?,?,?)", ("default", revision, encoded, state_hash, timestamp, email))
            db.execute("UPDATE workspaces SET revision=?,state_json=?,state_hash=?,updated_at=?,updated_by=? WHERE id='default'", (revision, encoded, state_hash, timestamp, email))
            db.execute("INSERT INTO server_audit(workspace_id,revision,actor,action,detail,previous_hash,state_hash,occurred_at) VALUES(?,?,?,?,?,?,?,?)", ("default", revision, email, "INVITATION_ACCEPTED", details["accessKind"], previous["state_hash"], state_hash, timestamp))
            db.execute("INSERT INTO accounts VALUES(?,?,?,?)", (email, details["name"], encoded_password, time.time()))
        else:
            db.execute("UPDATE accounts SET password_hash=? WHERE email=?", (encoded_password, email))
        db.execute("DELETE FROM account_sessions WHERE email=?", (email,))
        db.execute("UPDATE account_tokens SET used=1,status='Accepted' WHERE hash=?", (token["hash"],))
    return {"status": "Password set. You can now sign in."}

def bootstrap_owner(email: str, name: str, password: str):
    enabled()
    email = email_address(email)
    if email not in settings.owner_emails:
        raise ValueError("Set SAFIMAINT_OWNER_EMAILS to this owner address first")
    encoded = password_hash(password)
    with transaction() as db:
        if db.execute("SELECT 1 FROM accounts WHERE email=?", (email,)).fetchone():
            raise ValueError("Owner account already exists; use password reset")
        db.execute("INSERT INTO accounts VALUES(?,?,?,?)", (email, name, encoded, time.time()))

if __name__ == "__main__":
    import getpass
    from .database import migrate
    migrate()
    owner = input("Owner email: ").strip()
    name = input("Owner name: ").strip()
    password = getpass.getpass("Password (12–128 characters): ")
    if password != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords do not match")
    bootstrap_owner(owner, name, password)
    print("Owner account created. Start SafiMaintain and sign in at /auth.html.")
