import pytest


@pytest.fixture
def auth_headers(client):
    # Login and verify MFA to get access token
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    mfa_token = login_response.json()["mfa_token"]
    verify_response = client.post(
        "/api/v1/auth/verify-mfa", json={"mfa_token": mfa_token, "code": "123456"}
    )
    access_token = verify_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


def test_get_dashboard_unauthenticated(client):
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 401


def test_get_dashboard_success(client, auth_headers):
    response = client.get("/api/v1/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "customer_profile" in data
    assert data["customer_profile"]["email"] == "test@example.com"
    assert "accounts" in data
    assert "deposits" in data["accounts"]
    assert "loans" in data["accounts"]
    assert "mortgages" in data["accounts"]
    assert len(data["accounts"]["deposits"]) == 3
    assert len(data["accounts"]["loans"]) == 1
    assert len(data["accounts"]["mortgages"]) == 1


def test_get_summary_success(client, auth_headers):
    response = client.get("/api/v1/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_deposits" in data
    assert "total_loans" in data
    assert "total_mortgages" in data
    assert "net_worth" in data
    assert data["total_deposits"] == 12450.00 + 82780.00 + 50000.00
    assert data["total_loans"] == 15200.00
    assert data["total_mortgages"] == 345000.00


def test_get_banking_accounts(client, auth_headers):
    response = client.get("/api/v1/accounts/banking", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4


def test_get_mortgage_accounts(client, auth_headers):
    response = client.get("/api/v1/accounts/mortgage", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


def test_get_account_detail_fiserv(client, auth_headers):
    response = client.get("/api/v1/accounts/fiserv/fiserv-dda-1", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Primary Checking"
    assert "transactions" in data


def test_get_account_detail_cenlar(client, auth_headers):
    response = client.get("/api/v1/accounts/cenlar/cenlar-mort-1", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Home Mortgage"
    assert "escrow_breakdown" in data


def test_get_account_detail_not_found(client, auth_headers):
    response = client.get("/api/v1/accounts/fiserv/nonexistent", headers=auth_headers)
    assert response.status_code == 404


def test_get_profile_success(client, auth_headers):
    response = client.get("/api/v1/profile", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["cif"] == "CIF-982341"
    assert data["first_name"] == "Jane"
    assert data["last_name"] == "Doe"
