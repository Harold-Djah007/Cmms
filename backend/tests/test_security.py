import asyncio
import base64
import json
from dataclasses import replace

import pytest
from fastapi import HTTPException

from backend.app.config import settings
from backend.app.security import require_identity


def test_direct_api_rejects_forged_proxy_identity(monkeypatch):
    monkeypatch.setattr("backend.app.security.settings", replace(settings, dev_auth=False, trust_auth_headers=False))
    with pytest.raises(HTTPException) as error:
        asyncio.run(require_identity(None, None, "forged-owner", "owner@example.com"))
    assert error.value.status_code == 401


def test_configured_auth_proxy_resolves_principal(monkeypatch):
    monkeypatch.setattr("backend.app.security.settings", replace(settings, dev_auth=False, trust_auth_headers=True))
    raw = base64.b64encode(json.dumps({"claims": [
        {"typ": "email", "val": "OWNER@EXAMPLE.COM"}, {"typ": "oid", "val": "subject-1"}
    ]}).encode()).decode()
    identity = asyncio.run(require_identity(None, raw, None, None))
    assert identity.email == "owner@example.com"
    assert identity.subject == "subject-1"
