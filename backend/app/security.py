from __future__ import annotations

import base64
import json
from dataclasses import dataclass

from fastapi import Header, HTTPException, Request

from .config import settings


@dataclass(frozen=True)
class Identity:
    subject: str
    email: str
    name: str
    provider: str


def _azure_principal(raw: str) -> Identity | None:
    try:
        payload = json.loads(base64.b64decode(raw + "===").decode())
        claims = {item.get("typ", "").lower(): item.get("val", "") for item in payload.get("claims", [])}
        email = claims.get("preferred_username") or claims.get("email") or claims.get(
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", ""
        )
        name = claims.get("name") or claims.get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name", email)
        subject = claims.get("oid") or claims.get("sub") or payload.get("userId") or email
        return Identity(str(subject), str(email).lower(), str(name), "microsoft-entra") if email else None
    except Exception:
        return None


async def require_identity(
    request: Request,
    x_ms_client_principal: str | None = Header(default=None),
    x_ms_client_principal_id: str | None = Header(default=None),
    x_ms_client_principal_name: str | None = Header(default=None),
) -> Identity:
    if x_ms_client_principal:
        identity = _azure_principal(x_ms_client_principal)
        if identity:
            return identity
    if x_ms_client_principal_id and x_ms_client_principal_name:
        return Identity(x_ms_client_principal_id, x_ms_client_principal_name.lower(), x_ms_client_principal_name, "microsoft-entra")
    if settings.dev_auth and request.client and request.client.host in {"127.0.0.1", "::1", "testclient"}:
        return Identity("local-development", settings.dev_user_email.lower(), "Local developer", "development")
    raise HTTPException(status_code=401, detail="Sign-in is required")


def permission_set(state: dict | None, identity: Identity) -> set[str]:
    if identity.email in settings.owner_emails:
        return {"*"}
    # Local Docker/test development is an explicitly trusted development mode.
    # Do not make the local workspace unusable merely because the fresh-workspace
    # owner entered a different email from SAFIMAINT_DEV_USER_EMAIL. Production
    # Microsoft Entra identities still resolve through the persisted user/role map.
    if settings.dev_auth and identity.provider == "development":
        return {"*"}
    if not state:
        return {"*"} if settings.dev_auth else set()
    user = next((u for u in state.get("users", []) if str(u.get("email", "")).lower() == identity.email), None)
    if not user or not user.get("active"):
        return set()
    role = next((r for r in state.get("roles", []) if r.get("id") == user.get("roleId")), None)
    return set(role.get("permissions", [])) if role else set()


def demand(permissions: set[str], required: set[str]) -> None:
    if "*" not in permissions and not required.issubset(permissions):
        raise HTTPException(status_code=403, detail=f"Missing permission: {', '.join(sorted(required - permissions))}")

