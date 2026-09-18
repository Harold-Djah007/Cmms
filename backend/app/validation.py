from __future__ import annotations

from fastapi import HTTPException


COLLECTIONS = {
    "sites", "stores", "roles", "groups", "users", "assets", "meters", "vendors", "parts",
    "stockTransactions", "cycleCounts", "purchaseRequests", "purchaseOrders", "toolCrib", "workOrders",
    "scheduledMaintenance", "requests", "downtime", "assetEvents", "notificationRules", "notifications",
    "mailOutbox", "audit",
}

PERMISSIONS = {
    "sites": {"admin.people"}, "stores": {"inventory.manage"}, "roles": {"admin.people"},
    "groups": {"admin.people"}, "users": {"admin.people"}, "assets": {"asset.edit", "asset.state"},
    "meters": {"asset.edit"}, "vendors": {"vendor.manage", "purchase.manage"},
    "parts": {"inventory.manage", "inventory.issue", "purchase.manage"},
    "stockTransactions": {"inventory.manage", "inventory.issue", "purchase.manage"},
    "cycleCounts": {"inventory.count"}, "purchaseRequests": {"purchase.manage", "inventory.manage"},
    "purchaseOrders": {"purchase.manage"}, "toolCrib": {"inventory.manage"},
    "workOrders": {"work.manage", "work.execute", "asset.state"}, "scheduledMaintenance": {"pm.manage"},
    "requests": {"work.manage"}, "downtime": {"asset.state"}, "assetEvents": {"asset.state", "asset.edit"},
    "notificationRules": {"admin.notifications"}, "notifications": {"asset.view"},
    "mailOutbox": {"asset.view", "admin.notifications"}, "security": {"admin.people"},
}

APPEND_ONLY = {"stockTransactions", "audit"}


def _fail(message: str) -> None:
    raise HTTPException(status_code=422, detail=message)


def _ids(items: list, name: str) -> set[str]:
    ids = [str(item.get("id", "")) for item in items]
    if any(not item_id for item_id in ids):
        _fail(f"Every {name} record requires an id")
    if len(ids) != len(set(ids)):
        _fail(f"Duplicate id in {name}")
    return set(ids)


def validate_state(state: dict, previous: dict | None = None) -> set[str]:
    if not isinstance(state, dict):
        _fail("State must be a JSON object")
    missing = sorted(name for name in COLLECTIONS if not isinstance(state.get(name), list))
    if missing:
        _fail(f"Missing collections: {', '.join(missing)}")
    changed = {key for key in COLLECTIONS | {"security"} if previous is None or state.get(key) != previous.get(key)}
    ids = {name: _ids(state[name], name) for name in COLLECTIONS}

    assets = {a["id"]: a for a in state["assets"]}
    for asset in assets.values():
        parent = asset.get("parentId")
        if parent and parent not in assets:
            _fail(f"Asset {asset['id']} references missing parent {parent}")
        seen = {asset["id"]}
        while parent:
            if parent in seen:
                _fail(f"Asset hierarchy cycle detected at {asset['id']}")
            seen.add(parent)
            parent = assets[parent].get("parentId")
        if asset.get("operatingState") not in {"Online", "Offline", None}:
            _fail(f"Asset {asset['id']} has an invalid operating state")

    store_ids, part_ids, user_ids = ids["stores"], ids["parts"], ids["users"]
    for part in state["parts"]:
        if float(part.get("min", 0)) < 0 or float(part.get("max", 0)) < 0:
            _fail(f"Part {part['id']} has a negative stock threshold")
        for location in part.get("locations", []):
            if location.get("storeId") not in store_ids:
                _fail(f"Part {part['id']} references a missing store")
            if float(location.get("onHand", 0)) < 0:
                _fail(f"Part {part['id']} would have negative on-hand stock")
    for tx in state["stockTransactions"]:
        if tx.get("partId") not in part_ids or tx.get("storeId") not in store_ids:
            _fail(f"Stock transaction {tx['id']} has an invalid part or store")
    for work in state["workOrders"]:
        if any(asset_id not in assets for asset_id in work.get("assetIds", [])):
            _fail(f"Work order {work['id']} references a missing asset")
        if any(user_id not in user_ids for user_id in work.get("assigneeIds", [])):
            _fail(f"Work order {work['id']} references a missing assignee")

    if previous:
        for name in APPEND_ONLY:
            current_by_id = {x["id"]: x for x in state[name]}
            for old in previous.get(name, []):
                if current_by_id.get(old["id"]) != old:
                    _fail(f"{name} is append-only; {old['id']} cannot be altered or removed")
    return changed


def authorize_changes(changed: set[str], permissions: set[str]) -> None:
    if "*" in permissions:
        return
    denied = [name for name in sorted(changed) if name in PERMISSIONS and not (permissions & PERMISSIONS[name])]
    if denied:
        raise HTTPException(status_code=403, detail=f"Your role cannot change: {', '.join(denied)}")
