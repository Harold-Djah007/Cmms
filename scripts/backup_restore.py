"""Verified SQLite and attachment backups; restore only into a new directory."""
from __future__ import annotations

import argparse
from contextlib import closing
import hashlib
import json
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
from zipfile import ZipFile, ZIP_DEFLATED


def stream_digest(stream):
    hasher = hashlib.sha256()
    for chunk in iter(lambda: stream.read(1024 * 1024), b""):
        hasher.update(chunk)
    return hasher.hexdigest()


def backup(database: Path, attachments: Path, archive: Path):
    if not database.is_file():
        raise ValueError("Database does not exist")
    if archive.exists():
        raise ValueError("Backup already exists; choose a new filename")
    archive.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory() as folder:
        snapshot = Path(folder) / "safimaint.db"
        with closing(sqlite3.connect(database, timeout=30)) as lock:
            lock.execute("BEGIN IMMEDIATE")
            try:
                with closing(sqlite3.connect(database)) as source, closing(sqlite3.connect(snapshot)) as target:
                    source.backup(target)
                    if target.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                        raise ValueError("Database integrity check failed")
                entries = {"safimaint.db": snapshot}
                with snapshot.open("rb") as stream:
                    manifest = {"safimaint.db": stream_digest(stream)}
                for name, expected in lock.execute("SELECT storage_name,sha256 FROM attachments"):
                    if Path(name).name != name or "/" in name or "\\" in name:
                        raise ValueError("Invalid attachment storage name")
                    path = attachments / name
                    with path.open("rb") as stream:
                        if stream_digest(stream) != expected:
                            raise ValueError("Attachment integrity check failed")
                    entries["attachments/" + name] = path
                    manifest["attachments/" + name] = expected
                with ZipFile(archive, "x", ZIP_DEFLATED) as output:
                    for name, path in entries.items():
                        output.write(path, name)
                    output.writestr("manifest.json", json.dumps(manifest, sort_keys=True))
            finally:
                lock.rollback()
    verify(archive)


def verify(archive: Path):
    with ZipFile(archive) as source:
        names = source.namelist()
        if len(names) != len(set(names)) or source.testzip() is not None:
            raise ValueError("Invalid backup archive")
        manifest = json.loads(source.read("manifest.json"))
        if "safimaint.db" not in manifest or set(names) != set(manifest) | {"manifest.json"}:
            raise ValueError("Incomplete backup manifest")
        for name, expected in manifest.items():
            if name != "safimaint.db" and (not name.startswith("attachments/") or len(name.split("/")) != 2 or "\\" in name or name.split("/")[1] in {"", ".", ".."}):
                raise ValueError("Unsafe backup path")
            with source.open(name) as stream:
                if stream_digest(stream) != expected:
                    raise ValueError("Backup checksum mismatch")
        return manifest


def restore(archive: Path, destination: Path):
    manifest = verify(archive)
    if destination.exists():
        raise ValueError("Restore destination must be a new directory")
    destination.mkdir(parents=True)
    with ZipFile(archive) as source:
        for name in manifest:
            target = destination / name
            target.parent.mkdir(parents=True, exist_ok=True)
            with source.open(name) as stream, target.open("wb") as output:
                for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                    output.write(chunk)
    (destination / "attachments").mkdir(exist_ok=True)
    with closing(sqlite3.connect(destination / "safimaint.db")) as db:
        if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
            raise ValueError("Restored database integrity check failed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    save = commands.add_parser("backup")
    save.add_argument("--database", type=Path, required=True)
    save.add_argument("--attachments", type=Path, required=True)
    save.add_argument("--archive", type=Path, required=True)
    load = commands.add_parser("restore")
    load.add_argument("--archive", type=Path, required=True)
    load.add_argument("--destination", type=Path, required=True)
    check = commands.add_parser("verify")
    check.add_argument("--archive", type=Path, required=True)
    args = vars(parser.parse_args())
    command = args.pop("command")
    globals()[command](**args)
    print(command.capitalize() + " verified successfully")
