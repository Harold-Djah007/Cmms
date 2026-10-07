from __future__ import annotations

import logging
import time
import uuid
from urllib.parse import urlsplit

from starlette.responses import JSONResponse

from .config import settings

logger = logging.getLogger("safimaint.http")


def browser_write_allowed(scope) -> bool:
    """Reject foreign browser writes without relying on authentication cookies.

    Non-browser clients omit Origin/Fetch Metadata and still authenticate normally.
    Proxy authentication does not make a cross-origin browser request trustworthy.
    """
    headers = dict(scope.get("headers", []))
    if headers.get(b"sec-fetch-site", b"").lower() == b"cross-site":
        return False
    raw_origin = headers.get(b"origin")
    if raw_origin is None:
        return True
    try:
        origin = urlsplit(raw_origin.decode("ascii"))
        host = urlsplit("//" + headers.get(b"host", b"").decode("ascii"))
        if origin.scheme not in {"http", "https"} or not origin.hostname or origin.username or origin.password:
            return False
        if origin.path or origin.query or origin.fragment:
            return False
        if settings.environment == "production" and origin.scheme != "https":
            return False
        request_port = host.port or (443 if origin.scheme == "https" else 80)
        origin_port = origin.port or (443 if origin.scheme == "https" else 80)
        return origin.hostname == host.hostname and origin_port == request_port
    except (ValueError, UnicodeError):
        return False


class HttpSafetyMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        request_id = uuid.uuid4().hex
        started = time.monotonic()
        status = 500

        async def safe_send(message):
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                headers = list(message.get("headers", []))
                headers.extend([(b"x-request-id", request_id.encode()),
                                (b"x-content-type-options", b"nosniff"),
                                (b"x-frame-options", b"DENY"),
                                (b"referrer-policy", b"same-origin"),
                                (b"permissions-policy", b"camera=(self), microphone=(), geolocation=(self)")])
                if scope["path"].startswith("/api/"):
                    headers = [(k, v) for k, v in headers if k.lower() != b"cache-control"]
                    headers.append((b"cache-control", b"no-store"))
                if settings.environment == "production":
                    headers.append((b"strict-transport-security", b"max-age=31536000"))
                message["headers"] = headers
            await send(message)

        try:
            if scope["path"].startswith("/api/") and scope["method"] in {"POST", "PUT", "PATCH", "DELETE"}:
                if not browser_write_allowed(scope):
                    return await JSONResponse({"detail": "Cross-origin browser writes are not allowed"}, status_code=403)(scope, receive, safe_send)
            if scope["method"] in {"POST", "PUT", "PATCH"}:
                maximum = settings.max_request_bytes
                if scope["path"] == "/api/v1/state":
                    maximum = min(maximum, settings.max_state_bytes + 65536)
                headers = dict(scope.get("headers", []))
                try:
                    declared = int(headers.get(b"content-length", b"0"))
                except ValueError:
                    return await JSONResponse({"detail": "Invalid Content-Length"}, status_code=400)(scope, receive, safe_send)
                if declared < 0 or declared > maximum:
                    return await JSONResponse({"detail": "Request body is too large"}, status_code=413)(scope, receive, safe_send)
                messages, size = [], 0
                while True:
                    message = await receive()
                    if message["type"] == "http.disconnect":
                        return
                    size += len(message.get("body", b""))
                    if size > maximum:
                        return await JSONResponse({"detail": "Request body is too large"}, status_code=413)(scope, receive, safe_send)
                    messages.append(message)
                    if not message.get("more_body", False):
                        break

                async def replay():
                    return messages.pop(0) if messages else await receive()

                await self.app(scope, replay, safe_send)
            else:
                await self.app(scope, receive, safe_send)
        finally:
            logger.info("request=%s method=%s path=%s status=%s duration_ms=%.1f", request_id,
                        scope["method"], scope["path"], status, (time.monotonic()-started)*1000)
