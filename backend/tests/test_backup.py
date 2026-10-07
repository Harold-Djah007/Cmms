import sqlite3
from zipfile import ZipFile

import pytest

from backend.app.config import settings
from backend.tests.test_api import client_for
from backend.tests.test_validation import valid_state
from scripts.backup_restore import backup, restore, verify


def test_full_workspace_attachment_recovery(tmp_path):
    with client_for(tmp_path / "live") as client:
        assert client.put("/api/v1/state", json={"revision": 0, "state": valid_state()}).status_code == 200
        response = client.post("/api/v1/attachments", data={"entity_type": "asset", "entity_id": "A2"}, files={"file": ("procedure.txt", b"isolate pump", "text/plain")})
        assert response.status_code == 200
        archive = tmp_path / "backup.zip"
        backup(settings.database_path, settings.attachment_path, archive)
        destination = tmp_path / "recovered"
        restore(archive, destination)
        with sqlite3.connect(destination / "safimaint.db") as db:
            assert db.execute("SELECT revision FROM workspaces").fetchone()[0] == 1
            name = db.execute("SELECT storage_name FROM attachments").fetchone()[0]
        assert (destination / "attachments" / name).read_bytes() == b"isolate pump"
        with pytest.raises(ValueError, match="new directory"):
            restore(archive, destination)
        with pytest.raises(ValueError, match="already exists"):
            backup(settings.database_path, settings.attachment_path, archive)


def test_backup_rejects_tampering(tmp_path):
    archive = tmp_path / "bad.zip"
    with ZipFile(archive, "w") as output:
        output.writestr("manifest.json", '{"../escape":"abc","safimaint.db":"abc"}')
        output.writestr("../escape", b"bad")
        output.writestr("safimaint.db", b"bad")
    with pytest.raises(ValueError):
        verify(archive)
