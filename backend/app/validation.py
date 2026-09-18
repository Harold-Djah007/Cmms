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
    "assetEventTypes", "userNotificationPreferences", "workStatusDefinitions", "inventoryLots",
}

COLLECTIONS = CORE_COLLECTIONS | OPTIONAL_COLLECTIONS

PERMISSIONS = {
    "sites": {"admin.people"},
    "stores": {"inventory.manage"},
    "roles": {"admin.people"},
    "groups": {"admin.people"},
    "users": {"admin.people"},
    "assets": {"asset.edit", "asset.state"},
    "meters": {"asset.edit", "work.execute"},
    "vendors": {"vendor.manage", "purchase.manage"},
    "businesses": {"vendor.manage", "purchase.manage"},
    "parts": {"inventory.manage", "inventory.issue", "purchase.manage"},
    "inventoryLots": {"inventory.manage", "inventory.issue", "purchase.manage"},
    "stockTransactions": {"inventory.manage", "inventory.issue", "purchase.manage"},
    "cycleCounts": {"inventory.count"},
    "bomGroups": {"inventory.manage"},
    "purchaseRequests": {"purchase.manage", "inventory.manage", "work.execute"},
    "rfqs": {"purchase.manage"},
    "purchaseOrders": {"purchase.manage", "purchase.approve"},
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
    "purchasingSettings": {"purchase.manage", "purchase.approve"},
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

    # Older notification-preference records used userId as their natural key.
    # Give them a stable record id during migration so the expanded model remains
    # compatible with existing workspaces.
    for pref in state["userNotificationPreferences"]:
        if not pref.get("id") and pref.get("userId"):
            pref["id"] = f"UNP-{pref['userId']}"

    changed = {
        key for key in COLLECTIONS | {"security", "workSettings", "purchasingSettings"}
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
        for reading in meter.get("readings", []):
            try:
                float(reading.get("value", 0))
            except (TypeError, ValueError):
                _fail(f"Meter {meter['id']} contains a non-numeric reading")

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

    for lot in state["inventoryLots"]:
        _require(lot.get("partId"), part_ids, f"Inventory lot {lot['id']} references a missing part")
        _require(lot.get("storeId"), store_ids, f"Inventory lot {lot['id']} references a missing store")
        original = float(lot.get("qtyOriginal", 0) or 0)
        remaining = float(lot.get("qtyRemaining", 0) or 0)
        cost = float(lot.get("unitCost", 0) or 0)
        if original < 0 or remaining < 0 or remaining > original:
            _fail(f"Inventory lot {lot['id']} has invalid FIFO quantities")
        if cost < 0:
            _fail(f"Inventory lot {lot['id']} has a negative unit cost")

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
        previous_work = {item["id"]: item for item in previous.get("workOrders", [])}
        status_defs = {item.get("name"): item.get("control") for item in state.get("workStatusDefinitions", [])}
        work_settings = state.get("workSettings") or {}

        def work_control(work: dict) -> str:
            status = work.get("status")
            if status in status_defs:
                return status_defs[status] or "ACTIVE"
            return "CLOSED" if status in {"Completed", "Closed", "Cancelled"} else "ACTIVE"

        for work in state["workOrders"]:
            old = previous_work.get(work["id"])
            if not old:
                continue
            old_control = work_control(old)
            new_control = work_control(work)

            # Closed work is immutable until it is explicitly reopened. This prevents
            # silent post-close edits to costs, tasks, parts or failure history.
            if old_control == "CLOSED" and new_control == "CLOSED" and work != old:
                _fail(f"Closed work order {work['id']} is read-only until reopened")

            if old_control != "CLOSED" and new_control == "CLOSED" and work.get("status") != "Cancelled":
                if work_settings.get("requireAllTasksOnClose", True) and any(
                    task.get("status") != "Done" for task in work.get("tasks", [])
                ):
                    _fail(f"Work order {work['id']} cannot close with incomplete tasks")
                if work_settings.get("requireLaborOnClose", True) and float(work.get("actualHours", 0) or 0) <= 0:
                    _fail(f"Work order {work['id']} requires actual labor before closure")
                if work_settings.get("requireCompletionNote", True) and not str(work.get("completionNote", "")).strip():
                    _fail(f"Work order {work['id']} requires a completion note")
                if work_settings.get("requireFailureCodesForCorrective", True) and work.get("type") == "Corrective":
                    codes = work.get("failureCodes") or {}
                    if any(not codes.get(key) or codes.get(key) == "Not selected" for key in ("problem", "cause", "action")):
                        _fail(f"Corrective work order {work['id']} requires Problem, Cause and Action before closure")

    if previous:
        for name in APPEND_ONLY:
            current_by_id = {x["id"]: x for x in state[name]}
            for old in previous.get(name, []):
                if current_by_id.get(old["id"]) != old:
                    _fail(f"{name} is append-only; {old['id']} cannot be altered or removed")

    return changed


def _same_ids(current: list, previous: list) -> bool:
    return {item.get("id") for item in current} == {item.get("id") for item in previous}


def _record_map(items: list) -> dict[str, dict]:
    return {str(item.get("id")): item for item in items}


def _asset_state_only(current: list, previous: list) -> bool:
    if not _same_ids(current, previous):
        return False
    allowed = {"operatingState", "offlineSince", "downtimeReason"}
    old = _record_map(previous)
    for item in current:
        before = old[item["id"]]
        if any(item.get(key) != before.get(key) for key in set(item) | set(before) if key not in allowed):
            return False
    return True


def _meter_execution_only(current: list, previous: list) -> bool:
    if not _same_ids(current, previous):
        return False
    allowed = {"current", "readings"}
    old = _record_map(previous)
    for item in current:
        before = old[item["id"]]
        if any(item.get(key) != before.get(key) for key in set(item) | set(before) if key not in allowed):
            return False
    return True


def _part_issue_only(current: list, previous: list) -> bool:
    if not _same_ids(current, previous):
        return False
    old = _record_map(previous)
    for item in current:
        before = old[item["id"]]
        # Inventory issue may change quantity on hand, but not reorder policy,
        # prices, preferred suppliers, part identity or stock-location identity.
        item_base = {key: value for key, value in item.items() if key != "locations"}
        before_base = {key: value for key, value in before.items() if key != "locations"}
        if item_base != before_base:
            return False
        current_locations = [
            {key: value for key, value in location.items() if key != "onHand"}
            for location in item.get("locations", [])
        ]
        previous_locations = [
            {key: value for key, value in location.items() if key != "onHand"}
            for location in before.get("locations", [])
        ]
        if current_locations != previous_locations:
            return False
    return True


def _task_execution_shape(task: dict) -> dict:
    execution = {
        "status", "result", "resultNote", "completedAt", "completedBy",
        "meterId", "meterReading", "actualHours", "note",
    }
    return {key: value for key, value in task.items() if key not in execution}


def _part_execution_shape(line: dict) -> dict:
    return {key: value for key, value in line.items() if key != "actual"}


def _work_execution_only(current: list, previous: list) -> bool:
    # Technicians may execute existing work, but cannot create/delete work orders
    # or change planning fields such as assets, assignees, priority or dates.
    if not _same_ids(current, previous):
        return False
    allowed_top = {
        "status", "actualStart", "actualHours", "labor", "parts", "tasks",
        "completionNote", "completedAt", "closedAt", "closedBy",
        "failureCodes", "failureNote", "history", "customFields",
    }
    old = _record_map(previous)
    for work in current:
        before = old[work["id"]]
        if any(work.get(key) != before.get(key) for key in set(work) | set(before) if key not in allowed_top):
            return False

        before_tasks = _record_map(before.get("tasks", []))
        current_tasks = _record_map(work.get("tasks", []))
        if set(before_tasks) != set(current_tasks):
            return False
        for task_id, task in current_tasks.items():
            if _task_execution_shape(task) != _task_execution_shape(before_tasks[task_id]):
                return False

        before_parts = _record_map([
            {"id": line.get("partId"), **line} for line in before.get("parts", [])
        ])
        current_parts = _record_map([
            {"id": line.get("partId"), **line} for line in work.get("parts", [])
        ])
        if set(before_parts) != set(current_parts):
            return False
        for part_id, line in current_parts.items():
            if _part_execution_shape(line) != _part_execution_shape(before_parts[part_id]):
                return False

        old_status = before.get("status")
        new_status = work.get("status")
        if old_status in {"Completed", "Closed", "Cancelled"} and new_status not in {"Completed", "Closed", "Cancelled"}:
            return False
    return True


def _inventory_lot_issue_only(current: list, previous: list) -> bool:
    if not _same_ids(current, previous):
        return False
    old = _record_map(previous)
    for lot in current:
        before = old[lot["id"]]
        allowed = {"qtyRemaining"}
        if any(lot.get(key) != before.get(key) for key in set(lot) | set(before) if key not in allowed):
            return False
        if float(lot.get("qtyRemaining", 0) or 0) > float(before.get("qtyRemaining", 0) or 0):
            return False
    return True


def _po_approval_only(current: list, previous: list) -> bool:
    if not _same_ids(current, previous):
        return False
    old = _record_map(previous)
    allowed = {"status", "approvalStatus", "approvedBy", "approvedAt"}
    for po in current:
        before = old[po["id"]]
        if any(po.get(key) != before.get(key) for key in set(po) | set(before) if key not in allowed):
            return False
        if before.get("status") != "Awaiting Approval" or po.get("status") != "Approved":
            if po != before:
                return False
    return True


def _new_purchase_requests_only(current: list, previous: list) -> bool:
    old = _record_map(previous)
    now = _record_map(current)
    if not set(old).issubset(now):
        return False
    if any(now[item_id] != item for item_id, item in old.items()):
        return False
    return all(
        item.get("status") in {"Requested", "Open"} and item.get("workOrderId")
        for item_id, item in now.items() if item_id not in old
    )


def authorize_changes(
    changed: set[str],
    permissions: set[str],
    *,
    current: dict | None = None,
    previous: dict | None = None,
) -> None:
    if "*" in permissions:
        return

    denied: list[str] = []
    for name in sorted(changed):
        required = PERMISSIONS.get(name)
        if required and not (permissions & required):
            denied.append(name)
    if denied:
        raise HTTPException(status_code=403, detail=f"Your role cannot change: {', '.join(denied)}")

    if not current or previous is None:
        return

    if "assets" in changed and "asset.edit" not in permissions:
        if "asset.state" not in permissions or not _asset_state_only(current["assets"], previous.get("assets", [])):
            raise HTTPException(status_code=403, detail="Asset-state permission cannot edit asset master data")

    if "meters" in changed and "asset.edit" not in permissions:
        if "work.execute" not in permissions or not _meter_execution_only(current["meters"], previous.get("meters", [])):
            raise HTTPException(status_code=403, detail="Work execution may only post meter readings")

    if "parts" in changed and not (permissions & {"inventory.manage", "purchase.manage"}):
        if "inventory.issue" not in permissions or not _part_issue_only(current["parts"], previous.get("parts", [])):
            raise HTTPException(status_code=403, detail="Inventory issue permission may only change on-hand quantity")

    if "inventoryLots" in changed and not (permissions & {"inventory.manage", "purchase.manage"}):
        if "inventory.issue" not in permissions or not _inventory_lot_issue_only(
            current["inventoryLots"], previous.get("inventoryLots", [])
        ):
            raise HTTPException(status_code=403, detail="Inventory issue permission may only consume existing FIFO lots")

    if "purchaseOrders" in changed and "purchase.manage" not in permissions:
        if "purchase.approve" not in permissions or not _po_approval_only(
            current["purchaseOrders"], previous.get("purchaseOrders", [])
        ):
            raise HTTPException(status_code=403, detail="Purchase approval permission may only approve awaiting purchase orders")

    if "purchasingSettings" in changed and "purchase.manage" not in permissions:
        raise HTTPException(status_code=403, detail="Only purchasing managers can change purchasing policy")

    if "workOrders" in changed and "work.manage" not in permissions:
        if "work.execute" not in permissions or not _work_execution_only(current["workOrders"], previous.get("workOrders", [])):
            raise HTTPException(status_code=403, detail="Work execution permission cannot change planning fields or create work orders")

    if "purchaseRequests" in changed and not (permissions & {"purchase.manage", "inventory.manage"}):
        if "work.execute" not in permissions or not _new_purchase_requests_only(
            current["purchaseRequests"], previous.get("purchaseRequests", [])
        ):
            raise HTTPException(status_code=403, detail="Work execution may only create new purchase requests linked to work")
