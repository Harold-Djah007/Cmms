from __future__ import annotations

import copy
import smtplib
from dataclasses import replace
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.config import settings
from backend.app.main import app
from backend.tests.test_validation import valid_state


def client_for(tmp_path: Path) -> TestClient:
    object.__setattr__(settings, "database_path", tmp_path / "safimaint.db")
    object.__setattr__(settings, "attachment_path", tmp_path / "attachments")
    object.__setattr__(settings, "dev_auth", True)
    object.__setattr__(settings, "dev_user_email", "owner@example.com")
    return TestClient(app)


def test_workspace_round_trip_and_optimistic_concurrency(tmp_path):
    with client_for(tmp_path) as client:
        assert client.get("/api/health").status_code == 200
        assert client.get("/api/v1/state").status_code == 404
        created = client.put("/api/v1/state", json={"revision": 0, "state": valid_state(), "reason": "test bootstrap"})
        assert created.status_code == 200
        assert created.json()["revision"] == 1
        loaded = client.get("/api/v1/state")
        assert loaded.status_code == 200
        assert loaded.json()["state"]["assets"][1]["id"] == "A2"
        stale = client.put("/api/v1/state", json={"revision": 0, "state": valid_state()})
        assert stale.status_code == 409


def test_server_rejects_inventory_corruption(tmp_path):
    with client_for(tmp_path) as client:
        assert client.put("/api/v1/state", json={"revision": 0, "state": valid_state()}).status_code == 200
        broken = copy.deepcopy(valid_state())
        broken["parts"][0]["locations"][0]["onHand"] = -4
        response = client.put("/api/v1/state", json={"revision": 1, "state": broken})
        assert response.status_code == 422


def test_attachment_round_trip(tmp_path):
    with client_for(tmp_path) as client:
        client.put("/api/v1/state", json={"revision": 0, "state": valid_state()})
        uploaded = client.post("/api/v1/attachments", data={"entity_type": "asset", "entity_id": "A2"}, files={"file": ("manual.txt", b"isolation procedure", "text/plain")})
        assert uploaded.status_code == 200
        attachment_id = uploaded.json()["id"]
        listing = client.get("/api/v1/attachments/entity/asset/A2").json()["attachments"]
        assert listing[0]["original_name"] == "manual.txt"
        assert client.get(f"/api/v1/attachments/file/{attachment_id}").content == b"isolation procedure"


def test_part_documentation_round_trip(tmp_path):
    with client_for(tmp_path) as client:
        client.put("/api/v1/state", json={"revision": 0, "state": valid_state()})
        uploaded = client.post("/api/v1/attachments", data={"entity_type": "part", "entity_id": "P1"},
                               files={"file": ("specification.txt", b"spare part specification", "text/plain")})
        assert uploaded.status_code == 200
        listing = client.get("/api/v1/attachments/entity/part/P1").json()["attachments"]
        assert listing[0]["id"] == uploaded.json()["id"]
        assert client.get(f"/api/v1/attachments/file/{uploaded.json()['id']}").content == b"spare part specification"


def test_mail_delivery_keeps_accepted_messages_after_partial_failure(tmp_path, monkeypatch):
    class Relay:
        calls = 0
        def __init__(self, *args, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def send_message(self, message):
            Relay.calls += 1
            if Relay.calls == 2:
                raise smtplib.SMTPException("Temporary relay failure")
            return {}
    monkeypatch.setattr("backend.app.main.smtplib.SMTP", Relay)
    with client_for(tmp_path) as client:
        monkeypatch.setattr("backend.app.main.settings", replace(settings, smtp_host="test-relay", smtp_starttls=False))
        state = valid_state()
        state["mailOutbox"] = [{"id": f"M{i}", "to": "owner@example.com", "subject": "Alert", "body": "test", "status": "Queued locally"} for i in (1, 2)]
        client.put("/api/v1/state", json={"revision": 0, "state": state})
        assert client.post("/api/v1/mail/flush").status_code == 502
        saved = client.get("/api/v1/state").json()
        assert saved["state"]["mailOutbox"][0]["status"] == "Sent"
        assert saved["state"]["mailOutbox"][1]["status"] == "Queued locally"
        assert client.post("/api/v1/mail/flush").json()["sent"] == 1
        assert Relay.calls == 3


def test_mail_delivery_merges_concurrent_operational_save(tmp_path, monkeypatch):
    with client_for(tmp_path) as client:
        monkeypatch.setattr("backend.app.main.settings", replace(settings, smtp_host="test-relay", smtp_starttls=False))
        state = valid_state()
        state["mailOutbox"] = [{"id": "M1", "to": "owner@example.com", "subject": "Alert", "body": "test", "status": "Queued locally"}]
        client.put("/api/v1/state", json={"revision": 0, "state": state})
        class Relay:
            def __init__(self, *args, **kwargs): pass
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def send_message(self, message):
                payload = client.get("/api/v1/state").json()
                payload["state"]["assets"][0]["name"] = "Saved during delivery"
                assert client.put("/api/v1/state", json={"revision": payload["revision"], "state": payload["state"]}).status_code == 200
                return {}
        monkeypatch.setattr("backend.app.main.smtplib.SMTP", Relay)
        assert client.post("/api/v1/mail/flush").status_code == 200
        saved = client.get("/api/v1/state").json()
        assert saved["state"]["assets"][0]["name"] == "Saved during delivery"
        assert saved["state"]["mailOutbox"][0]["status"] == "Sent"
