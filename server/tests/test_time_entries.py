def test_create_time_entry_and_daily_summary(client):
    # Create project
    proj_res = client.post(
        "/api/v1/projects", json={"name": "Summary Project", "color_code": "#3B82F6"}
    )
    proj_id = proj_res.json()["id"]

    # Add 2 time entries on 2026-05-18
    e1 = client.post(
        "/api/v1/time-entries",
        json={
            "project_id": proj_id,
            "duration_seconds": 3600,
            "description": "First hour",
            "entry_date": "2026-05-18",
        },
    )
    assert e1.status_code == 201

    e2 = client.post(
        "/api/v1/time-entries",
        json={
            "project_id": proj_id,
            "duration_seconds": 1800,
            "description": "Half hour",
            "entry_date": "2026-05-18",
        },
    )
    assert e2.status_code == 201

    # Get Daily Summary
    summary_res = client.get("/api/v1/time-entries/daily-summary?date=2026-05-18")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["date"] == "2026-05-18"
    assert summary["total_duration_seconds"] >= 5400
    assert "formatted_total" in summary

    # Verify project breakdown item
    proj_item = next(p for p in summary["projects"] if p["project_id"] == proj_id)
    assert proj_item["project_name"] == "Summary Project"
    assert proj_item["color_code"] == "#3B82F6"
    assert proj_item["duration_seconds"] == 5400
    assert proj_item["formatted_duration"] == "1h 30m"


def test_create_time_entry_invalid_project(client):
    res = client.post(
        "/api/v1/time-entries",
        json={
            "project_id": "00000000-0000-0000-0000-000000000000",
            "duration_seconds": 3600,
            "description": "Orphan task",
            "entry_date": "2026-05-18",
        },
    )
    assert res.status_code == 400
