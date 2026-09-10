def test_create_submission(client):
    payload = {
        "user_id": "usr_cat_mgr_01",
        "cluster_name": "Small Town Value Cluster",
        "category": "Snacks",
        "selected_scenario": "Balanced",
        "sku_decisions": [
            {"sku_code": "SKU-10492", "action": "GROW"},
            {"sku_code": "SKU-8821", "action": "SWAP"},
            {"sku_code": "SKU-9041", "action": "MAINTAIN"},
        ],
    }
    response = client.post("/api/v1/submissions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["audit_id"].startswith("AUD-2026-")
    assert data["sku_decisions_count"] == 3
    assert "timestamp" in data
    assert "Audit ID: AUD-2026-" in data["message"]

    # Verify we can fetch the submission by audit_id
    audit_id = data["audit_id"]
    get_res = client.get(f"/api/v1/submissions/{audit_id}")
    assert get_res.status_code == 200
    audit_record = get_res.json()
    assert audit_record["audit_id"] == audit_id
    assert audit_record["selected_scenario"] == "Balanced"
    assert len(audit_record["sku_decisions_json"]) == 3


def test_list_submissions(client):
    response = client.get("/api/v1/submissions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_submission_not_found(client):
    response = client.get("/api/v1/submissions/NON-EXISTENT-AUDIT")
    assert response.status_code == 404
