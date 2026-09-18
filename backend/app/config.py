from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _flag(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    database_path: Path = Path(os.getenv("SAFIMAINT_DATABASE_PATH", "./data/safimaint.db"))
    attachment_path: Path = Path(os.getenv("SAFIMAINT_ATTACHMENT_PATH", "./data/attachments"))
    dev_auth: bool = _flag("SAFIMAINT_DEV_AUTH")
    dev_user_email: str = os.getenv("SAFIMAINT_DEV_USER_EMAIL", "abena.sarpong@safisana.org")
    owner_emails: tuple[str, ...] = tuple(
        x.strip().lower() for x in os.getenv("SAFIMAINT_OWNER_EMAILS", "").split(",") if x.strip()
    )
    max_state_bytes: int = int(os.getenv("SAFIMAINT_MAX_STATE_BYTES", "8000000"))
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from: str = os.getenv("SMTP_FROM", "SafiMaintain <maintenance@example.com>")
    smtp_starttls: bool = _flag("SMTP_STARTTLS", True)


settings = Settings()

