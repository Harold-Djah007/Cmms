from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _flag(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    auth_mode: str = os.getenv("SAFIMAINT_AUTH_MODE", "proxy").lower()
    public_url: str = os.getenv("SAFIMAINT_PUBLIC_URL", "").rstrip("/")
    environment: str = os.getenv("SAFIMAINT_ENVIRONMENT", "development").lower()
    allowed_hosts: tuple[str, ...] = tuple(x.strip() for x in os.getenv("SAFIMAINT_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",") if x.strip())
    max_request_bytes: int = int(os.getenv("SAFIMAINT_MAX_REQUEST_BYTES", "28000000"))
    database_path: Path = Path(os.getenv("SAFIMAINT_DATABASE_PATH", "./data/safimaint.db"))
    attachment_path: Path = Path(os.getenv("SAFIMAINT_ATTACHMENT_PATH", "./data/attachments"))
    dev_auth: bool = _flag("SAFIMAINT_DEV_AUTH")
    trust_auth_headers: bool = _flag("SAFIMAINT_TRUST_AUTH_HEADERS")
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


def validate_production_config(config: Settings = settings) -> None:
    if config.environment != "production":
        return
    failures = []
    if config.dev_auth:
        failures.append("development authentication must be disabled")
    if not config.trust_auth_headers and config.auth_mode != "password":
        failures.append("a trusted authentication proxy is required")
    if config.auth_mode == "password" and not config.public_url.startswith("https://"):
        failures.append("password authentication requires an HTTPS public URL")
    if not config.owner_emails or any("@" not in email or email.endswith(("@example.com", "@example.org", "@company.com")) for email in config.owner_emails):
        failures.append("real owner email addresses are required")
    if not config.allowed_hosts or any("*" in host or host in {"testserver", "localhost", "127.0.0.1", "example.com", "example.org"} or host.endswith((".example.com", ".example.org")) for host in config.allowed_hosts):
        failures.append("explicit production hostnames are required")
    if not config.database_path.is_absolute() or not config.attachment_path.is_absolute():
        failures.append("absolute persistent storage paths are required")
    if config.smtp_host and (not config.smtp_starttls or any(domain in config.smtp_from for domain in ("example.com", "example.org"))):
        failures.append("configured SMTP requires TLS and a real sender address")
    if failures:
        raise RuntimeError("Unsafe production configuration: " + "; ".join(failures))

