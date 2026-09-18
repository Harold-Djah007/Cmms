from __future__ import annotations

import copy
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
