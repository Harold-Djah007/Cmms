from __future__ import annotations

import sqlite3
from contextlib import contextmanager, closing
from pathlib import Path

from .config import settings


MIGRATIONS = [
    """
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      revision INTEGER NOT NULL,
      state_json TEXT NOT NULL,
      state_hash TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS state_history (
      workspace_id TEXT NOT NULL,
      revision INTEGER NOT NULL,
      state_json TEXT NOT NULL,
      state_hash TEXT NOT NULL,
      committed_at TEXT NOT NULL,
      committed_by TEXT NOT NULL,
      PRIMARY KEY (workspace_id, revision)
    );
    CREATE TABLE IF NOT EXISTS server_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT NOT NULL,
      revision INTEGER NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT NOT NULL,
      previous_hash TEXT,
      state_hash TEXT NOT NULL,
      occurred_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      original_name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      storage_name TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      uploaded_by TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_attachments_entity
      ON attachments(workspace_id, entity_type, entity_id);
    """,
    """
    CREATE TABLE accounts(email TEXT PRIMARY KEY, name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at REAL NOT NULL);
    CREATE TABLE account_tokens(hash TEXT PRIMARY KEY, kind TEXT NOT NULL, email TEXT NOT NULL, payload TEXT NOT NULL, expires REAL NOT NULL, used INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Pending');
    CREATE TABLE account_sessions(hash TEXT PRIMARY KEY, email TEXT NOT NULL REFERENCES accounts(email), expires REAL NOT NULL);
    CREATE TABLE account_attempts(bucket TEXT PRIMARY KEY, started REAL NOT NULL, count INTEGER NOT NULL);
    """
]


def connect() -> sqlite3.Connection:
    path = Path(settings.database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=20, isolation_level=None, check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA synchronous=FULL")
    return db


def migrate() -> None:
    with closing(connect()) as db:
        db.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
        for version, sql in enumerate(MIGRATIONS, start=1):
            if not db.execute("SELECT 1 FROM schema_migrations WHERE version=?", (version,)).fetchone():
                db.executescript(sql)
                db.execute("INSERT INTO schema_migrations(version) VALUES (?)", (version,))


@contextmanager
def transaction():
    db = connect()
    try:
        db.execute("BEGIN IMMEDIATE")
        yield db
        db.execute("COMMIT")
    except Exception:
        if db.in_transaction:
            db.execute("ROLLBACK")
        raise
    finally:
        db.close()
