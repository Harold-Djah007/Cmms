from __future__ import annotations

import copy

import pytest
from fastapi import HTTPException

from backend.app.validation import authorize_changes, validate_state


COLLECTIONS = [
    "sites", "stores", "roles", "groups", "users", "assets", "meters", "vendors", "parts",
    "stockTransactions", "cycleCounts", "purchaseRequests", "purchaseOrders", "toolCrib", "workOrders",
    "scheduledMaintenance", "requests", "downtime", "assetEvents", "notificationRules", "notifications",
    "mailOutbox", "audit",
]


def valid_state() -> dict:
    state = {name: [] for name in COLLECTIONS}
    state.update({
        "meta": {"version": "test"},
        "security": {"requireMfa": True},
        "sites": [{"id": "S1", "name": "Plant"}],
        "stores": [{"id": "ST1", "siteId": "S1", "name": "Main"}],
        "roles": [{"id": "R1", "permissions": ["asset.view", "asset.edit", "inventory.manage", "admin.people"]}],
        "users": [{"id": "U1", "email": "owner@example.com", "roleId": "R1", "active": True}],
        "assets": [
            {"id": "A1", "parentId": None, "operatingState": "Online"},
            {"id": "A2", "parentId": "A1", "operatingState": "Offline"},
        ],
        "parts": [{"id": "P1", "min": 1, "max": 5, "locations": [{"storeId": "ST1", "bin": "B1", "onHand": 2}]}],
        "stockTransactions": [{"id": "T1", "partId": "P1", "storeId": "ST1", "qty": 2}],
        "workOrders": [{"id": "W1", "assetIds": ["A2"], "assigneeIds": ["U1"]}],
        "audit": [{"id": "AU1", "action": "CREATED"}],
    })
    return state


def test_valid_state_passes_and_detects_asset_change():
    before = valid_state()
    after = copy.deepcopy(before)
    after["assets"][1]["operatingState"] = "Online"
    assert "assets" in validate_state(after, before)


@pytest.mark.parametrize("mutation", ["cycle", "negative_stock", "missing_parent", "duplicate"])
def test_invariants_reject_corruption(mutation):
    state = valid_state()
    if mutation == "cycle":
        state["assets"][0]["parentId"] = "A2"
    elif mutation == "negative_stock":
        state["parts"][0]["locations"][0]["onHand"] = -1
    elif mutation == "missing_parent":
        state["assets"][1]["parentId"] = "MISSING"
    else:
        state["assets"].append(copy.deepcopy(state["assets"][0]))
    with pytest.raises(HTTPException) as error:
        validate_state(state)
    assert error.value.status_code == 422


def test_ledger_and_audit_are_append_only():
    before = valid_state()
    after = copy.deepcopy(before)
    after["stockTransactions"][0]["qty"] = 999
    with pytest.raises(HTTPException, match="append-only"):
        validate_state(after, before)
    after = copy.deepcopy(before)
    after["audit"].clear()
    with pytest.raises(HTTPException, match="append-only"):
        validate_state(after, before)



def test_extended_cmms_relationships_are_validated_and_legacy_state_migrates():
    state = valid_state()
    # Extended collections are optional for old workspaces and are created by validation.
    validate_state(state)
    assert "projects" in state
    assert "taskGroups" in state
    assert "rfqs" in state
    assert "businesses" in state

    state["projects"].append({"id": "PROJ1", "siteId": "S1", "name": "Overhaul"})
    state["taskGroups"].append({"id": "TG1", "name": "Service SOP", "tasks": []})
    state["scheduledMaintenance"].append({
        "id": "PM1",
        "assetIds": ["A2"],
        "assigneeGroupId": None,
        "taskGroupId": "TG1",
        "includeTaskGroupIds": ["TG1"],
        "projectId": "PROJ1",
        "requiredParts": [{"partId": "P1", "qty": 1}],
        "triggers": [{"id": "TR1", "type": "Time", "nextDue": "2030-01-01"}],
    })
    state["workOrders"][0]["projectId"] = "PROJ1"
    state["workOrders"][0]["parts"] = [{"partId": "P1", "planned": 1, "actual": 0}]
    validate_state(state)


@pytest.mark.parametrize("mutation", ["bad_project", "bad_pm_asset", "bad_bom_part", "bad_rfq_business"])
def test_extended_relationships_reject_missing_references(mutation):
    state = valid_state()
    validate_state(state)
    if mutation == "bad_project":
        state["projects"].append({"id": "PROJ1", "siteId": "MISSING"})
    elif mutation == "bad_pm_asset":
        state["scheduledMaintenance"].append({
            "id": "PM1", "assetIds": ["MISSING"], "triggers": [], "requiredParts": []
        })
    elif mutation == "bad_bom_part":
        state["bomGroups"].append({"id": "BG1", "parts": [{"partId": "MISSING", "qty": 1}], "assetIds": []})
    else:
        state["rfqs"].append({"id": "RFQ1", "partId": "P1", "businessId": "MISSING"})
    with pytest.raises(HTTPException):
        validate_state(state)


def test_notification_preferences_get_stable_legacy_ids():
    state = valid_state()
    state["userNotificationPreferences"] = [{"userId": "U1", "inApp": True, "email": True}]
    validate_state(state)
    assert state["userNotificationPreferences"][0]["id"] == "UNP-U1"


def test_asset_state_permission_cannot_edit_asset_master_data():
    before = valid_state()
    validate_state(before)
    after = copy.deepcopy(before)
    after["assets"][1]["operatingState"] = "Online"
    changed = validate_state(after, before)
    authorize_changes(changed, {"asset.state"}, current=after, previous=before)

    bad = copy.deepcopy(before)
    bad["assets"][1]["name"] = "Renamed without asset.edit"
    changed = validate_state(bad, before)
    with pytest.raises(HTTPException, match="master data"):
        authorize_changes(changed, {"asset.state"}, current=bad, previous=before)


def test_work_execute_permission_cannot_replan_or_create_work():
    before = valid_state()
    validate_state(before)
    before["workOrders"][0].update({
        "status": "Open",
        "title": "Repair pump",
        "priority": "Medium",
        "tasks": [{"id": "T1", "text": "Inspect", "type": "Inspection", "status": "Todo"}],
        "parts": [{"partId": "P1", "planned": 1, "actual": 0}],
        "labor": [],
    })
    after = copy.deepcopy(before)
    after["workOrders"][0]["tasks"][0].update({"status": "Done", "result": "PASS"})
    after["workOrders"][0]["labor"].append({"id": "L1", "userId": "U1", "hours": 0.5})
    after["workOrders"][0]["actualHours"] = 0.5
    changed = validate_state(after, before)
    authorize_changes(changed, {"work.execute"}, current=after, previous=before)

    replanned = copy.deepcopy(before)
    replanned["workOrders"][0]["priority"] = "Critical"
    changed = validate_state(replanned, before)
    with pytest.raises(HTTPException, match="planning fields"):
        authorize_changes(changed, {"work.execute"}, current=replanned, previous=before)

    created = copy.deepcopy(before)
    created["workOrders"].append({
        "id": "W2", "assetIds": ["A2"], "assigneeIds": ["U1"], "status": "Open"
    })
    changed = validate_state(created, before)
    with pytest.raises(HTTPException, match="create work orders"):
        authorize_changes(changed, {"work.execute"}, current=created, previous=before)


def test_work_closure_controls_are_server_enforced():
    before = valid_state()
    validate_state(before)
    before["workStatusDefinitions"] = [
        {"id": "S1", "name": "Open", "control": "ACTIVE"},
        {"id": "S2", "name": "Completed", "control": "CLOSED"},
    ]
    before["workSettings"] = {
        "requireAllTasksOnClose": True,
        "requireLaborOnClose": True,
        "requireCompletionNote": True,
        "requireFailureCodesForCorrective": True,
    }
    before["failureCodeDefinitions"] = [{
        "id": "FC-LEAK",
        "problem": "Leak",
        "causes": [{
            "id": "CAUSE-SEAL",
            "name": "Seal failure",
            "actions": ["Replace seal"],
        }],
    }]
    before["workOrders"][0].update({
        "status": "Open",
        "type": "Corrective",
        "tasks": [{"id": "T1", "text": "Inspect", "status": "Todo"}],
        "actualHours": 0,
        "completionNote": "",
        "failureCodes": {"problem": "Not selected", "cause": "Not selected", "action": "Not selected"},
    })

    after = copy.deepcopy(before)
    after["workOrders"][0]["status"] = "Completed"
    with pytest.raises(HTTPException, match="incomplete tasks"):
        validate_state(after, before)

    after["workOrders"][0]["tasks"][0]["status"] = "Done"
    after["workOrders"][0]["actualHours"] = 1
    after["workOrders"][0]["completionNote"] = "Repaired and tested"
    after["workOrders"][0]["failureCodes"] = {
        "problem": "Leak", "cause": "Seal failure", "action": "Replace seal"
    }
    validate_state(after, before)


def test_inventory_issue_permission_only_changes_on_hand_quantity():
    before = valid_state()
    validate_state(before)
    after = copy.deepcopy(before)
    after["parts"][0]["locations"][0]["onHand"] = 1
    after["stockTransactions"].append({
        "id": "T2", "partId": "P1", "storeId": "ST1", "qty": -1, "type": "Issue"
    })
    changed = validate_state(after, before)
    authorize_changes(changed, {"inventory.issue"}, current=after, previous=before)

    bad = copy.deepcopy(before)
    bad["parts"][0]["min"] = 4
    changed = validate_state(bad, before)
    with pytest.raises(HTTPException, match="on-hand quantity"):
        authorize_changes(changed, {"inventory.issue"}, current=bad, previous=before)


def test_nested_pm_references_and_cycles_are_validated():
    state = valid_state()
    validate_state(state)
    state["scheduledMaintenance"] = [
        {"id": "PM1", "assetIds": ["A2"], "triggers": [], "requiredParts": [], "nestedPlanIds": ["PM2"]},
        {"id": "PM2", "assetIds": ["A2"], "triggers": [], "requiredParts": [], "nestedPlanIds": []},
    ]
    validate_state(state)

    state["scheduledMaintenance"][1]["nestedPlanIds"] = ["PM1"]
    with pytest.raises(HTTPException, match="nesting cycle"):
        validate_state(state)


def test_fifo_lots_reject_invalid_quantity_and_missing_references():
    state = valid_state()
    validate_state(state)
    state["inventoryLots"] = [{
        "id": "LOT1", "partId": "P1", "storeId": "ST1",
        "qtyOriginal": 5, "qtyRemaining": 3, "unitCost": 12.5,
    }]
    validate_state(state)

    bad = copy.deepcopy(state)
    bad["inventoryLots"][0]["qtyRemaining"] = 6
    with pytest.raises(HTTPException, match="FIFO quantities"):
        validate_state(bad)

    missing = copy.deepcopy(state)
    missing["inventoryLots"][0]["partId"] = "MISSING"
    with pytest.raises(HTTPException, match="missing part"):
        validate_state(missing)


def test_purchase_approver_can_only_approve_existing_po():
    before = valid_state()
    validate_state(before)
    before["purchaseOrders"] = [{
        "id": "PO1", "status": "Awaiting Approval", "approvalStatus": "Pending",
        "lines": [{"partId": "P1", "qty": 2, "unitCost": 10, "receivedQty": 0}],
        "sourceRequestIds": [],
    }]
    after = copy.deepcopy(before)
    after["purchaseOrders"][0].update({
        "status": "Approved", "approvalStatus": "Approved",
        "approvedBy": "U1", "approvedAt": "2030-01-01T00:00:00Z",
    })
    changed = validate_state(after, before)
    authorize_changes(changed, {"purchase.approve"}, current=after, previous=before)

    bad = copy.deepcopy(before)
    bad["purchaseOrders"][0]["lines"][0]["unitCost"] = 999
    changed = validate_state(bad, before)
    with pytest.raises(HTTPException, match="only approve"):
        authorize_changes(changed, {"purchase.approve"}, current=bad, previous=before)


def test_inventory_issue_can_consume_fifo_lot_and_record_actual_cost():
    before = valid_state()
    validate_state(before)
    before["inventoryLots"] = [{
        "id": "LOT1", "partId": "P1", "storeId": "ST1",
        "qtyOriginal": 2, "qtyRemaining": 2, "unitCost": 10,
    }]
    before["workOrders"][0].update({
        "status": "Open",
        "tasks": [],
        "parts": [{"partId": "P1", "planned": 1, "actual": 0, "actualCost": 0}],
        "labor": [],
    })
    after = copy.deepcopy(before)
    after["parts"][0]["locations"][0]["onHand"] = 1
    after["inventoryLots"][0]["qtyRemaining"] = 1
    after["stockTransactions"].append({
        "id": "T2", "partId": "P1", "storeId": "ST1", "qty": -1,
        "type": "Issue", "workOrderId": "W1",
    })
    after["workOrders"][0]["parts"][0]["actual"] = 1
    after["workOrders"][0]["parts"][0]["actualCost"] = 10
    changed = validate_state(after, before)
    authorize_changes(
        changed,
        {"inventory.issue", "work.execute"},
        current=after,
        previous=before,
    )


def test_failure_codes_must_follow_configured_problem_cause_action_hierarchy():
    state = valid_state()
    validate_state(state)
    state["failureCodeDefinitions"] = [{
        "id": "FC1",
        "problem": "Leak",
        "causes": [{"id": "C1", "name": "Seal failure", "actions": ["Replace seal"]}],
    }]
    state["workOrders"][0]["failureCodes"] = {
        "problem": "Leak", "cause": "Seal failure", "action": "Replace seal"
    }
    validate_state(state)

    bad_cause = copy.deepcopy(state)
    bad_cause["workOrders"][0]["failureCodes"]["cause"] = "Overload"
    with pytest.raises(HTTPException, match="cause is not valid"):
        validate_state(bad_cause, state)

    bad_action = copy.deepcopy(state)
    bad_action["workOrders"][0]["failureCodes"]["action"] = "Calibrate"
    with pytest.raises(HTTPException, match="action is not valid"):
        validate_state(bad_action, state)
