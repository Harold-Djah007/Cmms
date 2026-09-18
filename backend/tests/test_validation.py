from __future__ import annotations

import copy

import pytest
from fastapi import HTTPException

from backend.app.validation import validate_state


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
