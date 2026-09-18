from __future__ import annotations

import hashlib
import json
import mimetypes
import smtplib
import ssl
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .config import settings
from .database import connect, migrate, transaction
from .security import Identity, demand, permission_set, require_identity
from .validation import authorize_changes, validate_state

WORKSPACE = "default"
MAX_FILE_BYTES = 25 * 1024 * 1024
ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain", "text/csv"}

def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(state: dict) -> str:
    return json.dumps(state, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def read_workspace(db) -> tuple[dict | None, int, str | None]:
    row = db.execute("SELECT state_json,revision,state_hash FROM workspaces WHERE id=?", (WORKSPACE,)).fetchone()
    return (json.loads(row["state_json"]), row["revision"], row["state_hash"]) if row else (None, 0, None)


class StateWrite(BaseModel):
    revision: int
    state: dict
    reason: str = "Client synchronization"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    migrate()
    settings.attachment_path.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="SafiMaintain API", version="1.0.0", docs_url="/api/docs", redoc_url=None, lifespan=lifespan)


@app.get("/api/health")
def health() -> dict:
    with connect() as db:
        db.execute("SELECT 1").fetchone()
    return {"status": "ok", "service": "safimaint", "time": now()}


@app.get("/api/v1/session")
def session(identity: Identity = Depends(require_identity)) -> dict:
    with connect() as db:
        state, revision, _ = read_workspace(db)
    permissions = permission_set(state, identity)
    return {"identity": identity.__dict__, "permissions": sorted(permissions), "revision": revision}


@app.get("/api/v1/state")
def get_state(response: Response, identity: Identity = Depends(require_identity)) -> dict:
    with connect() as db:
        state, revision, state_hash = read_workspace(db)
    if state is None:
        raise HTTPException(status_code=404, detail="Workspace is not initialized")
    demand(permission_set(state, identity), {"asset.view"})
    response.headers["ETag"] = f'"{revision}-{state_hash[:12]}"'
    response.headers["Cache-Control"] = "no-store"
    return {"revision": revision, "state": state, "stateHash": state_hash, "updatedAt": state.get("meta", {}).get("serverUpdatedAt")}


@app.put("/api/v1/state")
def put_state(payload: StateWrite, identity: Identity = Depends(require_identity)) -> dict:
    encoded = canonical(payload.state)
    if len(encoded.encode()) > settings.max_state_bytes:
        raise HTTPException(status_code=413, detail="Workspace state is too large")
    with transaction() as db:
        previous, revision, previous_hash = read_workspace(db)
        if payload.revision != revision:
            raise HTTPException(status_code=409, detail={"message": "State changed on another device", "serverRevision": revision})
        changed = validate_state(payload.state, previous)
        authorize_changes(changed, permission_set(previous, identity), current=payload.state, previous=previous)
        next_revision = revision + 1
        payload.state.setdefault("meta", {})["serverRevision"] = next_revision
        payload.state["meta"]["serverUpdatedAt"] = now()
        payload.state["meta"]["serverUpdatedBy"] = identity.email
        encoded = canonical(payload.state)
        state_hash = hashlib.sha256(encoded.encode()).hexdigest()
        timestamp = now()
        db.execute(
            "INSERT INTO state_history(workspace_id,revision,state_json,state_hash,committed_at,committed_by) VALUES(?,?,?,?,?,?)",
            (WORKSPACE, next_revision, encoded, state_hash, timestamp, identity.email),
        )
        db.execute(
            "INSERT INTO workspaces(id,revision,state_json,state_hash,updated_at,updated_by) VALUES(?,?,?,?,?,?) "
            "ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,state_json=excluded.state_json,state_hash=excluded.state_hash,updated_at=excluded.updated_at,updated_by=excluded.updated_by",
            (WORKSPACE, next_revision, encoded, state_hash, timestamp, identity.email),
        )
        db.execute(
            "INSERT INTO server_audit(workspace_id,revision,actor,action,detail,previous_hash,state_hash,occurred_at) VALUES(?,?,?,?,?,?,?,?)",
            (WORKSPACE, next_revision, identity.email, "STATE_COMMIT", payload.reason[:500], previous_hash, state_hash, timestamp),
        )
    return {"revision": next_revision, "stateHash": state_hash, "updatedAt": timestamp}


@app.get("/api/v1/history")
def history(limit: int = 30, identity: Identity = Depends(require_identity)) -> dict:
    with connect() as db:
        state, _, _ = read_workspace(db)
        demand(permission_set(state, identity), {"admin.people"})
        rows = db.execute(
            "SELECT revision,state_hash,committed_at,committed_by FROM state_history WHERE workspace_id=? ORDER BY revision DESC LIMIT ?",
            (WORKSPACE, min(max(limit, 1), 200)),
        ).fetchall()
    return {"versions": [dict(row) for row in rows]}


@app.post("/api/v1/restore/{revision}")
def restore(revision: int, identity: Identity = Depends(require_identity)) -> dict:
    with transaction() as db:
        current, current_revision, current_hash = read_workspace(db)
        demand(permission_set(current, identity), {"admin.people"})
        row = db.execute("SELECT state_json FROM state_history WHERE workspace_id=? AND revision=?", (WORKSPACE, revision)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Revision not found")
        restored = json.loads(row["state_json"])
        restored.setdefault("audit", []).insert(0, {"id": f"AUD-{uuid.uuid4().hex[:12].upper()}", "at": now(), "userId": identity.email, "action": "SERVER_RESTORE", "entity": str(revision), "detail": f"Restored snapshot from revision {revision}"})
        validate_state(restored, None)
        next_revision = current_revision + 1
        restored.setdefault("meta", {})["serverRevision"] = next_revision
        restored["meta"]["serverUpdatedAt"] = now()
        restored["meta"]["serverUpdatedBy"] = identity.email
        encoded = canonical(restored)
        state_hash = hashlib.sha256(encoded.encode()).hexdigest()
        timestamp = now()
        db.execute("INSERT INTO state_history VALUES(?,?,?,?,?,?)", (WORKSPACE, next_revision, encoded, state_hash, timestamp, identity.email))
        db.execute("UPDATE workspaces SET revision=?,state_json=?,state_hash=?,updated_at=?,updated_by=? WHERE id=?", (next_revision, encoded, state_hash, timestamp, identity.email, WORKSPACE))
        db.execute("INSERT INTO server_audit(workspace_id,revision,actor,action,detail,previous_hash,state_hash,occurred_at) VALUES(?,?,?,?,?,?,?,?)", (WORKSPACE, next_revision, identity.email, "STATE_RESTORE", f"Restored revision {revision}", current_hash, state_hash, timestamp))
    return {"revision": next_revision, "stateHash": state_hash}


@app.post("/api/v1/attachments")
async def upload_attachment(
    entity_type: str = Form(...), entity_id: str = Form(...), file: UploadFile = File(...),
    identity: Identity = Depends(require_identity),
) -> dict:
    with connect() as db:
        state, _, _ = read_workspace(db)
    demand(permission_set(state, identity), {"asset.edit"})
    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported attachment type")
    data = await file.read(MAX_FILE_BYTES + 1)
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="Attachment exceeds 25 MB")
    digest = hashlib.sha256(data).hexdigest()
    attachment_id = f"ATT-{uuid.uuid4().hex.upper()}"
    storage_name = f"{attachment_id}-{digest[:16]}"
    (settings.attachment_path / storage_name).write_bytes(data)
    timestamp = now()
    with transaction() as db:
        db.execute("INSERT INTO attachments VALUES(?,?,?,?,?,?,?,?,?,?,?)", (attachment_id, WORKSPACE, entity_type[:40], entity_id[:120], (file.filename or "attachment")[:255], content_type, len(data), digest, storage_name, timestamp, identity.email))
    return {"id": attachment_id, "name": file.filename, "contentType": content_type, "size": len(data), "sha256": digest}


@app.get("/api/v1/attachments/entity/{entity_type}/{entity_id}")
def list_attachments(entity_type: str, entity_id: str, identity: Identity = Depends(require_identity)) -> dict:
    with connect() as db:
        state, _, _ = read_workspace(db)
        demand(permission_set(state, identity), {"asset.view"})
        rows = db.execute("SELECT id,original_name,content_type,size_bytes,sha256,uploaded_at,uploaded_by FROM attachments WHERE workspace_id=? AND entity_type=? AND entity_id=? ORDER BY uploaded_at DESC", (WORKSPACE, entity_type, entity_id)).fetchall()
    return {"attachments": [dict(row) for row in rows]}


@app.get("/api/v1/attachments/file/{attachment_id}")
def download_attachment(attachment_id: str, identity: Identity = Depends(require_identity)):
    with connect() as db:
        state, _, _ = read_workspace(db)
        demand(permission_set(state, identity), {"asset.view"})
        row = db.execute("SELECT * FROM attachments WHERE id=? AND workspace_id=?", (attachment_id, WORKSPACE)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Attachment not found")
    path = settings.attachment_path / row["storage_name"]
    if not path.is_file():
        raise HTTPException(status_code=410, detail="Attachment content is missing")
    return FileResponse(path, media_type=row["content_type"], filename=row["original_name"])


@app.post("/api/v1/mail/flush")
def flush_mail(identity: Identity = Depends(require_identity)) -> dict:
    with connect() as db:
        state, revision, _ = read_workspace(db)
        demand(permission_set(state, identity), {"admin.notifications"})
    if not settings.smtp_host:
        raise HTTPException(status_code=503, detail="SMTP delivery is not configured")
    pending = [m for m in state.get("mailOutbox", []) if str(m.get("status", "")).lower() in {"queued locally", "queued", "retry"}]
    sent = 0
    context = ssl.create_default_context()
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
        if settings.smtp_starttls:
            smtp.starttls(context=context)
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password)
        for item in pending:
            message = EmailMessage()
            message["From"], message["To"], message["Subject"] = settings.smtp_from, item["to"], item["subject"]
            message.set_content(item.get("body", ""))
            smtp.send_message(message)
            item["status"], item["sentAt"] = "Sent", now()
            sent += 1
    if not sent:
        return {"sent": 0, "revision": revision}
    with transaction() as db:
        _, current_revision, previous_hash = read_workspace(db)
        if current_revision != revision:
            raise HTTPException(status_code=409, detail="New records arrived during mail delivery; refresh before retrying")
        next_revision = revision + 1
        state.setdefault("meta", {})["serverRevision"] = next_revision
        state["meta"]["serverUpdatedAt"] = now()
        encoded = canonical(state)
        state_hash, timestamp = hashlib.sha256(encoded.encode()).hexdigest(), now()
        db.execute("INSERT INTO state_history VALUES(?,?,?,?,?,?)", (WORKSPACE, next_revision, encoded, state_hash, timestamp, identity.email))
        db.execute("UPDATE workspaces SET revision=?,state_json=?,state_hash=?,updated_at=?,updated_by=? WHERE id=?", (next_revision, encoded, state_hash, timestamp, identity.email, WORKSPACE))
        db.execute("INSERT INTO server_audit(workspace_id,revision,actor,action,detail,previous_hash,state_hash,occurred_at) VALUES(?,?,?,?,?,?,?,?)", (WORKSPACE, next_revision, identity.email, "MAIL_FLUSH", f"Delivered {sent} email messages", previous_hash, state_hash, timestamp))
    return {"sent": sent, "revision": next_revision}


STATIC = Path(__file__).resolve().parents[2] / "dist"


@app.get("/{path:path}", include_in_schema=False)
def spa(path: str):
    candidate = (STATIC / path).resolve()
    if path and candidate.is_file() and STATIC.resolve() in candidate.parents:
        return FileResponse(candidate)
    return FileResponse(STATIC / "index.html")
