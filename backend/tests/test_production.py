from dataclasses import replace
import asyncio
import sqlite3

import pytest

from backend.app.config import settings, validate_production_config
from backend.tests.test_api import client_for
from backend.app.http_safety import HttpSafetyMiddleware


def test_production_refuses_demo_defaults():
    with pytest.raises(RuntimeError, match="Unsafe production"):
        validate_production_config(replace(settings, environment="production", dev_auth=True))


def test_production_accepts_explicit_configuration(tmp_path):
    config = replace(settings, environment="production", dev_auth=False,
                     trust_auth_headers=True, owner_emails=("owner@safisana.org",),
                     allowed_hosts=("maintenance.safisana.org",),
                     database_path=tmp_path / "live.db", attachment_path=tmp_path / "files",
                     smtp_host="")
    validate_production_config(config)


def test_readiness_headers_host_and_request_limits(tmp_path, monkeypatch):
    with client_for(tmp_path) as client:
        response = client.get("/api/ready")
        assert response.status_code == 200
        assert response.headers["cache-control"] == "no-store"
        assert response.headers["x-frame-options"] == "DENY"
        assert len(response.headers["x-request-id"]) == 32
        assert client.get("/api/ready", headers={"Host": "untrusted.invalid"}).status_code == 400
        monkeypatch.setattr("backend.app.http_safety.settings", replace(settings, max_request_bytes=16))
        response = client.put("/api/v1/state", content=b"x" * 17)
        assert response.status_code == 413
        assert response.headers["cache-control"] == "no-store"
        assert client.put("/api/v1/state", content=b"", headers={"Content-Length": "bad"}).status_code == 400


def test_readiness_returns_503_on_storage_failure(tmp_path, monkeypatch):
    with client_for(tmp_path) as client:
        def broken():
            raise sqlite3.DatabaseError("private storage detail")
        monkeypatch.setattr("backend.app.main.connect", broken)
        response = client.get("/api/ready")
        assert response.status_code == 503
        assert "private storage" not in response.text


@pytest.mark.parametrize("headers", [
    {"Origin": "https://attacker.invalid"},
    {"Origin": "null"},
    {"Origin": "http://testserver.attacker.invalid"},
    {"Origin": "http://testserver:9090"},
    {"Origin": "http://testserver/path"},
    {"Sec-Fetch-Site": "cross-site"},
    {"Origin": "http://testserver", "Sec-Fetch-Site": "cross-site"},
])
def test_foreign_browser_write_rejected_before_state_or_mail_mutation(tmp_path, headers):
    with client_for(tmp_path) as client:
        for method, path in [("PUT", "/api/v1/state"), ("POST", "/api/v1/restore/1"), ("DELETE", "/api/v1/attachments/missing")]:
            response = client.request(method, path, headers=headers)
            assert response.status_code == 403
            assert "Cross-origin" in response.json()["detail"]
            assert response.headers["cache-control"] == "no-store"
        assert client.get("/api/ready", headers=headers).status_code == 200


def test_same_origin_browser_write_reaches_normal_validation(tmp_path):
    with client_for(tmp_path) as client:
        for origin in ("http://testserver", "http://testserver:80"):
            assert client.put("/api/v1/state", json={}, headers={"Origin": origin, "Sec-Fetch-Site": "same-origin"}).status_code == 422


def test_production_origin_uses_external_https_host(monkeypatch):
    from backend.app.http_safety import browser_write_allowed
    monkeypatch.setattr("backend.app.http_safety.settings", replace(settings, environment="production"))
    scope = {"headers": [(b"host", b"maintenance.safisana.org"), (b"origin", b"https://maintenance.safisana.org")]}
    assert browser_write_allowed(scope)
    scope["headers"][1] = (b"origin", b"http://maintenance.safisana.org")
    assert not browser_write_allowed(scope)


def test_chunked_body_cannot_bypass_size_limit(monkeypatch):
    monkeypatch.setattr("backend.app.http_safety.settings", replace(settings, max_request_bytes=4))
    messages = [{"type": "http.request", "body": b"abc", "more_body": True},
                {"type": "http.request", "body": b"def", "more_body": False}]
    sent = []
    async def receive():
        return messages.pop(0)
    async def send(message):
        sent.append(message)
    async def downstream(*args):
        pytest.fail("Oversized body reached the application")
    asyncio.run(HttpSafetyMiddleware(downstream)({"type": "http", "method": "PUT", "path": "/api/v1/state", "headers": []}, receive, send))
    assert sent[0]["status"] == 413
