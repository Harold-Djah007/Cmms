from __future__ import annotations

from fastapi import HTTPException


CORE_COLLECTIONS = {
    "sites", "stores", "roles", "groups", "users", "assets", "meters", "vendors", "parts",
    "stockTransactions", "cycleCounts", "purchaseRequests", "purchaseOrders", "toolCrib", "workOrders",
    "scheduledMaintenance", "requests", "downtime", "assetEvents", "notificationRules", "notifications",
    "mailOutbox", "audit",
}

# These collections were introduced as SafiMaintain moved from a page-oriented prototype
# to a connected CMMS operating model. Older workspaces are migrated to empty collections
# on the first validated write rather than being rejected.
OPTIONAL_COLLECTIONS = {
    "projects", "assetMoves", "bomGroups", "rfqs", "receipts", "businesses", "taskGroups",
    "failureCodeDefinitions", "assetCategories", "priorityDefinitions", "maintenanceTypeDefinitions",
    "meterUnits", "workCustomFieldDefinitions", "assetCustomFieldDefinitions", "workflowRules",
    "integrationConnections", "savedReports", "importJobs", "exportJobs", "workSavedFilters",
    "assetEventTypes", "userNotificationPreferences", "workStatusDefinitions",
}

COLLECTIONS = CORE_COLLECTIONS | OPTIONAL_COLLECTIONS

PERMISSIONS = {
    "sites": {"admin.people"},
    "stores": {"inventory.manage"},
    "roles": {"admin.people"},
    "groups": {"admin.people"},
    "users": {"admin.people"},
    "assets": {"asset.edit", "asset.state"},
    "meters": {"asset.edit"},
    "vendors": {"vendor.manage", "purchase.manage"},
    "businesses": {"vendor.manage", "purchase.manage"},
    "parts": {"inventory.manage", "inventory.issue", "purchase.manage"},
    "stockTransactions": {"inventory.manage", "inventory.issue", "purchase.manage"},
    "cycleCounts": {"inventory.count"},
    "bomGroups": {"inventory.manage"},
    "purchaseRequests": {"purchase.manage", "inventory.manage"},
    "rfqs": {"purchase.manage"},
    "purchaseOrders": {"purchase.manage"},
    "receipts": {"purchase.manage", "inventory.manage"},
    "toolCrib": {"inventory.manage"},
    "workOrders": {"work.manage", "work.execute", "asset.state"},
    "workSavedFilters": {"work.manage", "work.execute"},
    "workStatusDefinitions": {"work.manage"},
    "workCustomFieldDefinitions": {"work.manage", "admin.people"},
    "projects": {"work.manage"},
    "taskGroups": {"work.manage", "pm.manage"},
    "scheduledMaintenance": {"pm.manage"},
    "requests": {"work.manage"},
    "downtime": {"asset.state"},
    "assetEvents": {"asset.state", "asset.edit"},
    "assetMoves": {"asset.state", "asset.edit"},
    "assetEventTypes": {"asset.edit", "admin.people"},
    "assetCustomFieldDefinitions": {"asset.edit", "admin.people"},
    "assetCategories": {"asset.edit", "admin.people"},
    "priorityDefinitions": {"work.manage", "admin.people"},
    "maintenanceTypeDefinitions": {"work.manage", "admin.people"},
    "failureCodeDefinitions": {"work.manage", "admin.people"},
    "meterUnits": {"asset.edit", "admin.people"},
    "workflowRules": {"admin.notifications", "work.manage"},
    "notificationRules": {"admin.notifications"},
    "userNotificationPreferences": {"asset.view", "admin.notifications"},
    "notifications": {"asset.view"},
    "mailOutbox": {"asset.view", "admin.notifications"},
    "integrationConnections": {"admin.people"},
    "savedReports": {"report.view"},
    "importJobs": {"admin.people"},
    "exportJobs": {"report.view"},
    "security": {"admin.people"},
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


def _require(value: str | None, allowed: set[str], message: str) -> None:
    if value and value not in allowed:
        _fail(message)


def _require_many(values: list | None, allowed: set[str], message: str) -> None:
    if any(value not in allowed for value in (values or [])):
        _fail(message)


def validate_state(state: dict, previous: dict | None = None) -> set[str]:
    if not isinstance(state, dict):
        _fail("State must be a JSON object")

    missing = sorted(name for name in CORE_COLLECTIONS if not isinstance(state.get(name), list))
    if missing:
        _fail(f"Missing collections: {', '.join(missing)}")

    for name in OPTIONAL_COLLECTIONS:
        value = state.get(name)
        if value is None:
            state[name] = []
        elif not isinstance(value, list):
            _fail(f"{name} must be a list")

    changed = {
        key for key in COLLECTIONS | {"security", "workSettings"}
        if previous is None or state.get(key) != previous.get(key)
    }
    ids = {name: _ids(state[name], name) for name in COLLECTIONS}

    site_ids = ids["sites"]
    store_ids = ids["stores"]
    role_ids = ids["roles"]
    group_ids = ids["groups"]
    user_ids = ids["users"]
    asset_ids = ids["assets"]
    meter_ids = ids["meters"]
    vendor_ids = ids["vendors"]
    business_ids = ids["businesses"]
    part_ids = ids["parts"]
    work_ids = ids["workOrders"]
    project_ids = ids["projects"]
    task_group_ids = ids["taskGroups"]

    for store in state["stores"]:
        _require(store.get("siteId"), site_ids, f"Store {store['id']} references a missing site")

    for group in state["groups"]:
        _require(group.get("managerId"), user_ids, f"Group {group['id']} references a missing manager")
        _require_many(group.get("siteIds"), site_ids, f"Group {group['id']} references a missing site")

    for user in state["users"]:
        _require(user.get("roleId"), role_ids, f"User {user['id']} references a missing role")
        _require_many(user.get("groupIds"), group_ids, f"User {user['id']} references a missing group")
        _require_many(user.get("siteIds"), site_ids, f"User {user['id']} references a missing site")
        if float(user.get("hourlyRate", 0) or 0) < 0:
            _fail(f"User {user['id']} has a negative labor rate")
        if float(user.get("weeklyCapacityHours", 0) or 0) < 0:
            _fail(f"User {user['id']} has negative weekly capacity")

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
        _require(asset.get("siteId"), site_ids, f"Asset {asset['id']} references a missing site")
        _require(asset.get("ownerUserId"), user_ids, f"Asset {asset['id']} references a missing owner")
        _require(asset.get("ownerGroupId"), group_ids, f"Asset {asset['id']} references a missing owner group")
        _require_many(asset.get("bom"), part_ids, f"Asset {asset['id']} BOM references a missing part")
        for link in asset.get("businessLinks", []):
            _require(link.get("businessId"), business_ids, f"Asset {asset['id']} references a missing business")
        if asset.get("operatingState") not in {"Online", "Offline", None}:
            _fail(f"Asset {asset['id']} has an invalid operating state")

    for meter in state["meters"]:
        _require(meter.get("assetId"), asset_ids, f"Meter {meter['id']} references a missing asset")
        last = None
        for reading in meter.get("readings", []):
            value = float(reading.get("value", 0))
            if last is not None and value < last:
                # Fiix-style cumulative meters cannot go backwards; reset meters should be
                # modeled as a new meter or an explicit reset event.
                _fail(f"Meter {meter['id']} readings cannot decrease")
            last = value

    for part in state["parts"]:
        if float(part.get("min", 0)) < 0 or float(part.get("max", 0)) < 0:
            _fail(f"Part {part['id']} has a negative stock threshold")
        if float(part.get("max", 0) or 0) and float(part.get("min", 0) or 0) > float(part.get("max", 0)):
            _fail(f"Part {part['id']} minimum stock exceeds maximum stock")
        _require(part.get("vendorId"), vendor_ids, f"Part {part['id']} references a missing vendor")
        _require(part.get("businessId"), business_ids, f"Part {part['id']} references a missing business")
        for location in part.get("locations", []):
            _require(location.get("storeId"), store_ids, f"Part {part['id']} references a missing store")
            if float(location.get("onHand", 0)) < 0:
                _fail(f"Part {part['id']} would have negative on-hand stock")

    for tx in state["stockTransactions"]:
        _require(tx.get("partId"), part_ids, f"Stock transaction {tx['id']} references a missing part")
        _require(tx.get("storeId"), store_ids, f"Stock transaction {tx['id']} references a missing store")
        _require(tx.get("workOrderId"), work_ids, f"Stock transaction {tx['id']} references a missing work order")

    for count in state["cycleCounts"]:
        _require(count.get("partId"), part_ids, f"Cycle count {count['id']} references a missing part")
        _require(count.get("storeId"), store_ids, f"Cycle count {count['id']} references a missing store")
        _require(count.get("userId"), user_ids, f"Cycle count {count['id']} references a missing user")

    for work in state["workOrders"]:
        _require_many(work.get("assetIds"), asset_ids, f"Work order {work['id']} references a missing asset")
        _require_many(work.get("assigneeIds"), user_ids, f"Work order {work['id']} references a missing assignee")
        _require(work.get("assigneeGroupId"), group_ids, f"Work order {work['id']} references a missing assigned group")
        _require(work.get("projectId"), project_ids, f"Work order {work['id']} references a missing project")
        for task in work.get("tasks", []):
            _require(task.get("assigneeId"), user_ids, f"Task {task.get('id')} references a missing assignee")
            _require(task.get("assigneeGroupId"), group_ids, f"Task {task.get('id')} references a missing group")
            _require(task.get("meterId"), meter_ids, f"Task {task.get('id')} references a missing meter")
            if float(task.get("estimateHours", 0) or 0) < 0:
                _fail(f"Task {task.get('id')} has a negative estimate")
        for line in work.get("parts", []):
            _require(line.get("partId"), part_ids, f"Work order {work['id']} references a missing part")
            if float(line.get("planned", 0) or 0) < 0 or float(line.get("actual", 0) or 0) < 0:
                _fail(f"Work order {work['id']} has a negative part quantity")
        for labor in work.get("labor", []):
            _require(labor.get("userId"), user_ids, f"Work order {work['id']} labor references a missing user")
            if float(labor.get("hours", 0) or 0) < 0:
                _fail(f"Work order {work['id']} has negative labor")

    for pm in state["scheduledMaintenance"]:
        pm_assets = pm.get("assetIds") or ([pm.get("assetId")] if pm.get("assetId") else [])
        _require_many(pm_assets, asset_ids, f"Scheduled maintenance {pm['id']} references a missing asset")
        _require(pm.get("assigneeGroupId"), group_ids, f"Scheduled maintenance {pm['id']} references a missing group")
        _require(pm.get("taskGroupId"), task_group_ids, f"Scheduled maintenance {pm['id']} references a missing task group")
        _require_many(pm.get("includeTaskGroupIds"), task_group_ids, f"Scheduled maintenance {pm['id']} references a missing task group")
        _require(pm.get("projectId"), project_ids, f"Scheduled maintenance {pm['id']} references a missing project")
        for line in pm.get("requiredParts", []):
            _require(line.get("partId"), part_ids, f"Scheduled maintenance {pm['id']} references a missing part")
        for trigger in pm.get("triggers", []):
            if trigger.get("type") not in {"Time", "Meter", "Event", None}:
                _fail(f"Scheduled maintenance {pm['id']} has an invalid trigger type")
            _require(trigger.get("meterId"), meter_ids, f"Scheduled maintenance {pm['id']} references a missing meter")

    for request in state["requests"]:
        _require(request.get("assetId"), asset_ids, f"Request {request['id']} references a missing asset")
        _require(request.get("reviewerId"), user_ids, f"Request {request['id']} references a missing reviewer")
        _require(request.get("workOrderId"), work_ids, f"Request {request['id']} references a missing work order")

    for downtime in state["downtime"]:
        _require(downtime.get("assetId"), asset_ids, f"Downtime {downtime['id']} references a missing asset")
        _require(downtime.get("workOrderId"), work_ids, f"Downtime {downtime['id']} references a missing work order")

    for event in state["assetEvents"]:
        _require(event.get("assetId"), asset_ids, f"Asset event {event['id']} references a missing asset")
        _require(event.get("workOrderId"), work_ids, f"Asset event {event['id']} references a missing work order")

    for move in state["assetMoves"]:
        _require(move.get("assetId"), asset_ids, f"Asset move {move['id']} references a missing asset")
        _require(move.get("movedBy"), user_ids, f"Asset move {move['id']} references a missing user")

    for group in state["bomGroups"]:
        for line in group.get("parts", []):
            _require(line.get("partId"), part_ids, f"BOM group {group['id']} references a missing part")
        _require_many(group.get("assetIds"), asset_ids, f"BOM group {group['id']} references a missing asset")

    for project in state["projects"]:
        _require(project.get("siteId"), site_ids, f"Project {project['id']} references a missing site")

    for rfq in state["rfqs"]:
        _require(rfq.get("partId"), part_ids, f"RFQ {rfq['id']} references a missing part")
        _require(rfq.get("businessId"), business_ids, f"RFQ {rfq['id']} references a missing business")
        _require(rfq.get("vendorId"), vendor_ids, f"RFQ {rfq['id']} references a missing vendor")
        _require(rfq.get("purchaseOrderId"), ids["purchaseOrders"], f"RFQ {rfq['id']} references a missing purchase order")

    for purchase_request in state["purchaseRequests"]:
        _require(purchase_request.get("partId"), part_ids, f"Purchase request {purchase_request['id']} references a missing part")
        _require(purchase_request.get("workOrderId"), work_ids, f"Purchase request {purchase_request['id']} references a missing work order")

    for po in state["purchaseOrders"]:
        _require(po.get("vendorId"), vendor_ids, f"Purchase order {po['id']} references a missing vendor")
        _require(po.get("businessId"), business_ids, f"Purchase order {po['id']} references a missing business")
        for line in po.get("lines", []):
            _require(line.get("partId"), part_ids, f"Purchase order {po['id']} references a missing part")

    for receipt in state["receipts"]:
        _require(receipt.get("purchaseOrderId"), ids["purchaseOrders"], f"Receipt {receipt['id']} references a missing purchase order")
        _require(receipt.get("storeId"), store_ids, f"Receipt {receipt['id']} references a missing store")

    for pref in state["userNotificationPreferences"]:
        _require(pref.get("userId"), user_ids, f"Notification preference {pref['id']} references a missing user")

    for notification in state["notifications"]:
        _require(notification.get("userId"), user_ids, f"Notification {notification['id']} references a missing user")

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
