import pytest
import httpx
from unittest.mock import patch, MagicMock
from server.config import Settings
from server.services.fiserv import (
    FiservLiveService,
    FiservMockService,
    get_core_banking_service,
)


@pytest.fixture
def live_settings():
    return Settings(
        FISERV_MODE="live",
        FISERV_API_KEY="test-key",
        FISERV_API_SECRET="test-secret",
        FISERV_TOKEN_URL="https://api.fiserv.com/v1/oauth/token",
        FISERV_BASE_URL="https://api.fiserv.com/v1",
        FISERV_ORG_ID="test-org",
        FISERV_DEMO_ACCOUNTS="5041733:DDA,302034131:Savings,290001702:CD",
    )


def test_live_service_init(live_settings):
    service = FiservLiveService(live_settings)
    assert service.api_key == "test-key"
    assert service.api_secret == "test-secret"
    assert service.token_url == "https://api.fiserv.com/v1/oauth/token"
    assert service.base_url == "https://api.fiserv.com/v1"
    assert service.org_id == "test-org"
    assert len(service.accounts_to_query) == 3
    assert service.accounts_to_query[0] == {"id": "5041733", "type": "DDA"}
    assert service.accounts_to_query[1] == {"id": "302034131", "type": "Savings"}
    assert service.accounts_to_query[2] == {"id": "290001702", "type": "CD"}


@patch("httpx.post")
def test_get_token_success(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    # Mock token response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
        "token_type": "Bearer",
    }
    mock_post.return_value = mock_response

    token = service._get_token()
    assert token == "mock-access-token"
    assert service._token == "mock-access-token"
    assert service._token_expires_at is not None

    # Second call should use cached token without calling POST again
    mock_post.reset_mock()
    token2 = service._get_token()
    assert token2 == "mock-access-token"
    mock_post.assert_not_called()


@patch("httpx.post")
def test_get_accounts_success(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    # Mock token response and account details response
    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 15000.50}}]
            }
        }
    }

    # Side effect to return token first, then account details
    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    accounts = service.get_accounts("CIF-982341")
    assert len(accounts) == 3
    assert accounts[0]["id"] == "5041733"
    assert accounts[0]["type"] == "DDA"
    assert accounts[0]["balance"] == 15000.50
    assert accounts[0]["account_number"] == "•••• 1733"
    assert accounts[0]["status"] == "Active"


@patch("httpx.post")
def test_get_accounts_graceful_degradation(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    # Mock token response
    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    # First account succeeds, second fails, third succeeds
    mock_acct_success = MagicMock()
    mock_acct_success.status_code = 200
    mock_acct_success.json.return_value = {
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 100.0}}]
            }
        }
    }

    mock_acct_fail = MagicMock()
    mock_acct_fail.status_code = 500
    mock_acct_fail.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Internal Server Error", request=MagicMock(), response=mock_acct_fail
    )

    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_success,
        mock_acct_fail,
        mock_acct_success,
    ]

    accounts = service.get_accounts("CIF-982341")
    # Should skip the failed one and return 2 accounts
    assert len(accounts) == 2
    assert accounts[0]["id"] == "5041733"
    assert accounts[1]["id"] == "290001702"


@patch("httpx.post")
def test_token_refresh_on_401(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "expired-token"

    # First call returns 401, second call (token fetch) returns 200, third call (retry) returns 200
    mock_401 = MagicMock()
    mock_401.status_code = 401
    mock_401.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Unauthorized", request=MagicMock(), response=mock_401
    )

    mock_token = MagicMock()
    mock_token.status_code = 200
    mock_token.json.return_value = {"access_token": "new-token", "expires_in": 3600}

    mock_success = MagicMock()
    mock_success.status_code = 200
    mock_success.json.return_value = {
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 500.0}}]
            }
        }
    }

    mock_post.side_effect = [mock_401, mock_token, mock_success]

    url = f"{service.base_url}/acctservice/acctmgmt/accounts/secured"
    res = service._make_api_call(url, {})
    assert res["AcctRec"]["DepositAcctInfo"]["AcctBal"][0]["CurAmt"]["Amt"] == 500.0
    assert service._token == "new-token"


def test_not_implemented_methods(live_settings):
    service = FiservLiveService(live_settings)
    with pytest.raises(NotImplementedError):
        service.get_available_balance("5041733")
    with pytest.raises(NotImplementedError):
        service.debit_account("5041733", 100.0)
    with pytest.raises(NotImplementedError):
        service.credit_account("5041733", 100.0)
    with pytest.raises(NotImplementedError):
        service.validate_account("5041733")


def test_factory_pattern():
    # Test default mock mode
    with patch("server.config.settings.FISERV_MODE", "mock"):
        # Reset global instance
        import server.services.fiserv

        server.services.fiserv._service_instance = None
        service = get_core_banking_service()
        assert isinstance(service, FiservMockService)
        assert not isinstance(service, FiservLiveService)

    # Test live mode
    with (
        patch("server.config.settings.FISERV_MODE", "live"),
        patch("server.config.settings.FISERV_API_KEY", "key"),
        patch("server.config.settings.FISERV_API_SECRET", "secret"),
        patch("server.config.settings.FISERV_TOKEN_URL", "url"),
        patch("server.config.settings.FISERV_BASE_URL", "base"),
        patch("server.config.settings.FISERV_ORG_ID", "org"),
        patch("server.config.settings.FISERV_DEMO_ACCOUNTS", "123:DDA"),
    ):
        server.services.fiserv._service_instance = None
        service = get_core_banking_service()
        assert isinstance(service, FiservLiveService)
