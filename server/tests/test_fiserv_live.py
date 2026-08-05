import pytest
import json
import httpx
from datetime import datetime
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
        FISERV_TOKEN_URL="https://bankinghub-cert.fiservapis.com/fts-apim/oauth2/v2",
        FISERV_BASE_URL="https://bankinghub-cert.fiservapis.com/banking/efx/v1",
        FISERV_ORG_ID="999990301",
        FISERV_PARTY_ID="PARTY-982341",
        FISERV_DEMO_ACCOUNTS="5041733:DDA,302034131:Savings,290001702:CD",
    )


def test_live_service_init(live_settings):
    service = FiservLiveService(live_settings)
    assert service.api_key == "test-key"
    assert service.api_secret == "test-secret"
    assert (
        service.token_url == "https://bankinghub-cert.fiservapis.com/fts-apim/oauth2/v2"
    )
    assert service.base_url == "https://bankinghub-cert.fiservapis.com/banking/efx/v1"
    assert service.org_id == "999990301"
    assert service.party_id == "PARTY-982341"
    assert len(service.accounts_to_query) == 3
    assert service.accounts_to_query[0] == {"id": "5041733", "type": "DDA"}
    assert service.accounts_to_query[1] == {"id": "302034131", "type": "Savings"}
    assert service.accounts_to_query[2] == {"id": "290001702", "type": "CD"}


@patch("httpx.post")
def test_get_token_success(mock_post, live_settings):
    service = FiservLiveService(live_settings)

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

    mock_post.reset_mock()
    token2 = service._get_token()
    assert token2 == "mock-access-token"
    mock_post.assert_not_called()


@patch("httpx.post")
def test_get_token_string_expires_in(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": "3600",
        "token_type": "Bearer",
    }
    mock_post.return_value = mock_response

    token = service._get_token()
    assert token == "mock-access-token"
    assert service._token_expires_at is not None


@patch("httpx.post")
def test_token_refresh_on_401(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "expired-token"

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "new-token",
        "expires_in": 3600,
    }

    mock_401_resp = MagicMock()
    mock_401_resp.status_code = 401

    mock_200_resp = MagicMock()
    mock_200_resp.status_code = 200
    mock_200_resp.json.return_value = {"Status": {"StatusCode": "0"}}

    mock_post.side_effect = [mock_401_resp, mock_token_resp, mock_200_resp]

    res = service._make_api_call("https://example.com/api", {"test": True})
    assert res == {"Status": {"StatusCode": "0"}}
    assert service._token == "new-token"


@patch("httpx.post")
def test_get_accounts_success(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {
            "StatusCode": "0",
            "StatusDesc": "Success",
            "Severity": "Info",
        },
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "Nickname": "Primary Checking",
                "Rate": "0.05",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 12450.00}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    accounts = service.get_accounts("CIF-982341")
    assert len(accounts) == 3
    assert accounts[0]["id"] == "5041733"
    assert accounts[0]["balance"] == 12450.00

    assert mock_post.call_count == 4

    acct_call_args = mock_post.call_args_list[1]
    url_called = acct_call_args[0][0]
    assert (
        url_called
        == "https://bankinghub-cert.fiservapis.com/banking/efx/v1/acctservice/acctmgmt/accounts/secured"
    )

    headers_called = acct_call_args.kwargs.get("headers", {})
    assert "Authorization" in headers_called
    assert headers_called["Authorization"] == "Bearer mock-access-token"
    assert "EFXHeader" in headers_called
    efx_header = json.loads(headers_called["EFXHeader"])
    assert efx_header["OrganizationId"] == "999990301"
    assert "TrnId" in efx_header

    json_body = acct_call_args.kwargs.get("json", {})
    assert "AcctSel" in json_body
    assert "AcctKeys" in json_body["AcctSel"]
    assert json_body["AcctSel"]["AcctKeys"]["AcctId"] == "5041733"
    assert json_body["AcctSel"]["AcctKeys"]["AcctType"] == "DDA"


@patch("httpx.post")
def test_get_accounts_parses_live_fiserv_data(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {
            "StatusCode": "0",
            "StatusDesc": "Success",
            "Severity": "Info",
        },
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "Nickname": "Primary Checking",
                "Rate": "0.05",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 15000.50}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    accounts = service.get_accounts("CIF-982341")
    assert len(accounts) == 3
    assert accounts[0]["id"] == "5041733"
    assert accounts[0]["name"] == "Primary Checking"
    assert accounts[0]["type"] == "DDA"
    assert accounts[0]["balance"] == 15000.50
    assert accounts[0]["account_number"] == "•••• 1733"
    assert accounts[0]["status"] == "Active"
    assert "raw_source" in accounts[0]


@patch("httpx.post")
def test_get_accounts_loan_type_exclusion(mock_post, live_settings):
    settings_with_loan = Settings(
        FISERV_MODE="live",
        FISERV_API_KEY="test-key",
        FISERV_API_SECRET="test-secret",
        FISERV_TOKEN_URL="https://bankinghub-cert.fiservapis.com/fts-apim/oauth2/v2",
        FISERV_BASE_URL="https://bankinghub-cert.fiservapis.com/banking/efx/v1",
        FISERV_ORG_ID="999990301",
        FISERV_PARTY_ID="PARTY-982341",
        FISERV_DEMO_ACCOUNTS="5041733:DDA,111222:Loan,333444:DDL",
    )
    service = FiservLiveService(settings_with_loan)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 1000.00}}],
            }
        },
    }

    mock_post.side_effect = [mock_token_resp, mock_acct_resp]

    accounts = service.get_accounts("CIF-982341")
    assert len(accounts) == 1
    assert accounts[0]["id"] == "5041733"


@patch("httpx.post")
def test_get_accounts_business_error_handling(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_err_resp = MagicMock()
    mock_err_resp.status_code = 200
    mock_err_resp.json.return_value = {
        "Status": {"StatusCode": "1001", "StatusDesc": "Account Not Found"}
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_err_resp,
        mock_err_resp,
        mock_err_resp,
    ]

    accounts = service.get_accounts("CIF-982341")
    assert len(accounts) == 0


@patch("httpx.post")
def test_get_accounts_graceful_degradation(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_post.side_effect = [
        mock_token_resp,
        httpx.ConnectError("Connection failed"),
        httpx.ConnectError("Connection failed"),
        httpx.ConnectError("Connection failed"),
        httpx.ConnectError("Connection failed"),
        httpx.ConnectError("Connection failed"),
        httpx.ConnectError("Connection failed"),
    ]

    accounts = service.get_accounts("CIF-982341")
    assert accounts == []


@patch("httpx.post")
def test_get_accounts_uses_cache_within_ttl(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 5000.00}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    accs1 = service.get_accounts("CIF-982341")
    assert len(accs1) == 3

    mock_post.reset_mock()
    accs2 = service.get_accounts("CIF-982341")
    assert len(accs2) == 3
    mock_post.assert_not_called()


@patch("httpx.post")
def test_get_accounts_stale_fallback_on_degradation(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 5000.00}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    accs1 = service.get_accounts("CIF-982341")
    assert len(accs1) == 3

    # Force cache expiration beyond fresh TTL but within stale TTL
    service._accounts_cache_at -= service._FRESH_TTL * 2

    mock_err_resp = MagicMock()
    mock_err_resp.status_code = 200
    mock_err_resp.json.return_value = {"Status": {"StatusCode": "1001"}}

    mock_post.reset_mock()
    mock_post.side_effect = [mock_err_resp, mock_err_resp, mock_err_resp]

    accs2 = service.get_accounts("CIF-982341")
    assert len(accs2) == 3  # Serves last known good snapshot


@patch("httpx.post")
def test_get_accounts_retries_transient_network_error(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 5000.00}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        httpx.ConnectError("Transient error"),
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    accounts = service.get_accounts("CIF-982341")
    assert len(accounts) == 3


@patch("httpx.post")
def test_raw_source_in_live_and_mock_mode(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 5000.00}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    live_accounts = service.get_accounts("CIF-982341")
    assert "raw_source" in live_accounts[0]

    mock_service = FiservMockService()
    mock_accounts = mock_service.get_accounts("CIF-982341")
    assert len(mock_accounts) > 0


@patch("httpx.post")
def test_debit_and_credit_are_simulated(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 1000.00}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    assert service.get_available_balance("5041733") == 1000.00
    assert service.debit_account("5041733", 200.00) is True
    assert service.get_available_balance("5041733") == 800.00

    assert service.credit_account("5041733", 100.00) is True
    assert service.get_available_balance("5041733") == 900.00


@patch("httpx.post")
def test_debit_account_insufficient_funds(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 100.00}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    assert service.debit_account("5041733", 500.00) is False
    assert service.get_available_balance("5041733") == 100.00


@patch("httpx.post")
def test_validate_account_live(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 1000.00}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    assert service.validate_account("5041733") is True
    assert service.validate_account("non-existent") is False


@patch("httpx.post")
def test_simulated_payment_persists_across_cache_refresh(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 1000.00}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_acct_resp,
        mock_acct_resp,
        mock_acct_resp,
    ]

    assert service.get_available_balance("5041733") == 1000.00
    service.debit_account("5041733", 300.00)

    # Force cache refresh
    service._accounts_cache = None

    mock_post.reset_mock()
    mock_post.side_effect = [mock_acct_resp, mock_acct_resp, mock_acct_resp]

    accounts = service.get_accounts("CIF-982341")
    assert accounts[0]["balance"] == 700.00


def test_factory_pattern():
    with patch("server.config.settings.FISERV_MODE", "mock"):
        srv = get_core_banking_service()
        assert isinstance(srv, FiservMockService)

    with patch("server.config.settings.FISERV_MODE", "live"):
        with patch("server.services.fiserv._service_instance", None):
            srv_live = get_core_banking_service()
            assert isinstance(srv_live, FiservLiveService)


# --- Profile Update Live Tests ---


@patch("httpx.post")
def test_update_customer_profile_live_success(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"

    mock_put_resp = MagicMock()
    mock_put_resp.status_code = 200
    mock_put_resp.json.return_value = {
        "PartyId": "PARTY-982341",
        "Status": {
            "StatusCode": 0,
            "Severity": "Info",
            "StatusDesc": "Party updated successfully",
        },
    }

    with patch("httpx.put", return_value=mock_put_resp) as mock_put:
        res = service.update_customer_profile(
            "CIF-982341",
            {
                "address": "789 Main St, Dallas, TX 75201",
                "phone": "1-555-123-4567",
                "email": "jane.new@example.com",
            },
        )

        assert res["success"] is True
        assert res["live_sync_available"] is True
        assert res["fallback_reason"] is None

        mock_put.assert_called_once()
        url_called = mock_put.call_args[0][0]
        assert (
            url_called
            == "https://bankinghub-cert.fiservapis.com/banking/efx/v1/partyservice/parties/parties"
        )

        body_called = mock_put.call_args.kwargs["json"]
        assert body_called["OvrdAutoAckInd"] == "true"
        assert body_called["PartyKeys"]["PartyId"] == "PARTY-982341"
        assert (
            body_called["PersonPartyInfo"]["PersonData"]["PersonName"][0]["GivenName"]
            == "Jane"
        )
        assert (
            body_called["PersonPartyInfo"]["PersonData"]["PersonName"][0]["FamilyName"]
            == "Doe"
        )
        contacts = body_called["PersonPartyInfo"]["PersonData"]["Contact"]
        assert contacts[0]["PostAddr"]["Addr1"] == "789 Main St"
        assert contacts[0]["PostAddr"]["City"] == "Dallas"
        assert contacts[0]["PostAddr"]["StateProv"] == "TX"
        assert contacts[0]["PostAddr"]["PostalCode"] == "75201"
        assert contacts[1]["Email"]["EmailAddr"] == "jane.new@example.com"
        assert contacts[2]["PhoneNum"]["Phone"] == "1-555-123-4567"


@patch("httpx.post")
def test_update_customer_profile_party_id_not_configured(mock_post):
    ungated_settings = Settings(
        FISERV_MODE="live",
        FISERV_API_KEY="test-key",
        FISERV_API_SECRET="test-secret",
        FISERV_TOKEN_URL="https://bankinghub-cert.fiservapis.com/fts-apim/oauth2/v2",
        FISERV_BASE_URL="https://bankinghub-cert.fiservapis.com/banking/efx/v1",
        FISERV_ORG_ID="999990301",
        FISERV_PARTY_ID=None,
        FISERV_DEMO_ACCOUNTS="5041733:DDA",
    )
    service = FiservLiveService(ungated_settings)

    with patch("httpx.put") as mock_put:
        res = service.update_customer_profile(
            "CIF-982341",
            {
                "address": "789 Main St, Dallas, TX 75201",
                "phone": "1-555-123-4567",
                "email": "jane.new@example.com",
            },
        )
        assert res["success"] is True
        assert res["live_sync_available"] is False
        assert res["fallback_reason"] == "PARTY_ID_NOT_CONFIGURED"
        mock_put.assert_not_called()


@patch("httpx.post")
def test_update_customer_profile_400_bad_request_fallback(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"

    mock_400 = MagicMock()
    mock_400.status_code = 400
    mock_400.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Bad Request", request=MagicMock(), response=mock_400
    )

    with patch("httpx.put", return_value=mock_400):
        res = service.update_customer_profile(
            "CIF-982341",
            {
                "address": "123 Main St, New York, NY 10001",
                "phone": "1-800-555-0199",
                "email": "test@example.com",
            },
        )

        assert res["success"] is True
        assert res["live_sync_available"] is False
        assert res["fallback_reason"] == "CLIENT_ERROR_4XX"


@patch("httpx.post")
def test_update_customer_profile_state_mutation_ordering_on_error(
    mock_post, live_settings
):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"

    initial_phone = service.profiles["CIF-982341"]["phone"]

    mock_500 = MagicMock()
    mock_500.status_code = 500
    mock_500.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Internal Server Error", request=MagicMock(), response=mock_500
    )

    with patch("httpx.put", return_value=mock_500):
        with pytest.raises(httpx.HTTPStatusError):
            service.update_customer_profile(
                "CIF-982341",
                {
                    "address": "123 Main St, New York, NY 10001",
                    "phone": "1-999-999-9999",
                    "email": "test@example.com",
                },
            )

    # Local state MUST NOT have mutated on a path that raises an exception!
    assert service.profiles["CIF-982341"]["phone"] == initial_phone


@patch("httpx.post")
def test_get_customer_profile_live_success(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"

    mock_party_resp = MagicMock()
    mock_party_resp.status_code = 200
    mock_party_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "PartyRec": {
            "PersonPartyInfo": {
                "PersonData": {
                    "PersonName": [{"GivenName": "Jane", "FamilyName": "Doe"}],
                    "Contact": [
                        {
                            "PostAddr": {
                                "Addr1": "100 Live Ave",
                                "City": "Austin",
                                "StateProv": "TX",
                                "PostalCode": "78701",
                            }
                        },
                        {"Email": {"EmailAddr": "jane.live@example.com"}},
                        {"PhoneNum": {"Phone": "1-512-555-0100"}},
                    ],
                }
            }
        },
    }

    mock_post.return_value = mock_party_resp

    profile = service.get_customer_profile("CIF-982341")
    assert profile is not None
    assert profile["cif"] == "CIF-982341"
    assert profile["email"] == "jane.live@example.com"
    assert profile["phone"] == "1-512-555-0100"
    assert profile["relationship_manager"] == "Robert Vance"
    assert profile["metadata"]["live_sync_available"] is True
    assert profile["metadata"]["fiserv_sync"] == "LIVE_SUCCESS"

    # Dedicated profile cache check
    assert service._profile_cache == profile
    assert service._profile_cache_at is not None


@patch("httpx.post")
def test_get_customer_profile_party_id_not_configured(mock_post):
    ungated_settings = Settings(
        FISERV_MODE="live",
        FISERV_API_KEY="test-key",
        FISERV_API_SECRET="test-secret",
        FISERV_TOKEN_URL="https://bankinghub-cert.fiservapis.com/fts-apim/oauth2/v2",
        FISERV_BASE_URL="https://bankinghub-cert.fiservapis.com/banking/efx/v1",
        FISERV_ORG_ID="999990301",
        FISERV_PARTY_ID=None,
        FISERV_DEMO_ACCOUNTS="5041733:DDA",
    )
    service = FiservLiveService(ungated_settings)

    profile = service.get_customer_profile("CIF-982341")
    assert profile is not None
    assert profile["cif"] == "CIF-982341"
    assert profile["metadata"]["live_sync_available"] is False
    assert profile["metadata"]["fallback_reason"] == "PARTY_ID_NOT_CONFIGURED"


@patch("httpx.post")
def test_get_customer_profile_4xx_fallback(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"

    mock_404 = MagicMock()
    mock_404.status_code = 404
    mock_404.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Not Found", request=MagicMock(), response=mock_404
    )

    mock_post.return_value = mock_404

    profile = service.get_customer_profile("CIF-982341")
    assert profile is not None
    assert profile["cif"] == "CIF-982341"
    assert profile["metadata"]["live_sync_available"] is False
    assert profile["metadata"]["fallback_reason"] == "ENTITLEMENT_DENIED"


@patch("httpx.post")
def test_update_communication_preferences_live_success(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"
    service._accounts_cache = [
        {
            "id": "5041733",
            "name": "Primary Checking",
            "type": "DDA",
            "balance": 1000.0,
            "status": "Active",
        }
    ]
    service._accounts_cache_at = datetime.utcnow()

    mock_secured_resp = MagicMock()
    mock_secured_resp.status_code = 200
    mock_secured_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "EPreferenceRec": {"EPreferenceKeys": {"EPreferenceIdent": "epref-123"}},
    }
    mock_post.side_effect = [mock_secured_resp]

    mock_put_resp = MagicMock()
    mock_put_resp.status_code = 200
    mock_put_resp.json.return_value = {
        "PartyId": "PARTY-982341",
        "Status": {
            "StatusCode": 0,
            "Severity": "Info",
            "StatusDesc": "ePreferences updated successfully",
        },
    }

    with patch("httpx.put", return_value=mock_put_resp) as mock_put:
        res = service.update_communication_preferences(
            "CIF-982341",
            {
                "paperless": True,
                "email_notif": True,
                "sms_notif": False,
                "marketing": False,
            },
        )

        assert res["success"] is True
        assert res["live_sync_available"] is True
        assert res["fallback_reason"] is None
        assert res["partial_fiserv_sync"] == ["sms_notif", "marketing"]

        mock_put.assert_called_once()
        url_called = mock_put.call_args[0][0]
        assert (
            url_called
            == "https://bankinghub-cert.fiservapis.com/banking/efx/v1/epreferenceservice/epreference/ePreferences"
        )

        body_called = mock_put.call_args.kwargs["json"]
        assert body_called["OverrideException"] is True
        assert body_called["EPreferenceKeys"]["AcctKeys"]["AcctId"] == "5041733"
        assert body_called["EPreferenceKeys"]["AcctKeys"]["AcctType"] == "DDA"
        assert body_called["EPreferenceKeys"]["ePreferenceIdent"] == "epref-123"
        assert body_called["EPreferenceInfo"]["CombinedStmtInd"] is True
        assert len(body_called["EPreferenceInfo"]["EmailLink"]) == 1
        assert (
            body_called["EPreferenceInfo"]["EmailLink"][0]["Email"]["EmailAddr"]
            == "test@example.com"
        )


@patch("httpx.post")
def test_update_communication_preferences_3_call_sequence_with_create(
    mock_post, live_settings
):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"
    service._accounts_cache = [
        {
            "id": "5041733",
            "name": "Primary Checking",
            "type": "DDA",
            "balance": 1000.0,
            "status": "Active",
        }
    ]
    service._accounts_cache_at = datetime.utcnow()

    mock_secured_resp = MagicMock()
    mock_secured_resp.status_code = 200
    mock_secured_resp.json.return_value = {
        "Status": {"StatusCode": "1001", "StatusDesc": "Not Found"}
    }

    mock_create_resp = MagicMock()
    mock_create_resp.status_code = 200
    mock_create_resp.json.return_value = {
        "Status": {"StatusCode": "0"},
        "EPreferenceStatusRec": {
            "EPreferenceKeys": [{"EPreferenceIdent": "new-epref-456"}]
        },
    }

    mock_post.side_effect = [mock_secured_resp, mock_create_resp]

    mock_put_resp = MagicMock()
    mock_put_resp.status_code = 200
    mock_put_resp.json.return_value = {
        "Status": {"StatusCode": 0, "StatusDesc": "ePreferences updated successfully"},
    }

    with patch("httpx.put", return_value=mock_put_resp) as mock_put:
        res = service.update_communication_preferences(
            "CIF-982341",
            {
                "paperless": False,
                "email_notif": False,
                "sms_notif": True,
                "marketing": True,
            },
        )

        assert res["success"] is True
        assert res["live_sync_available"] is True
        assert res["partial_fiserv_sync"] == ["sms_notif", "marketing"]

        body_called = mock_put.call_args.kwargs["json"]
        assert body_called["EPreferenceKeys"]["ePreferenceIdent"] == "new-epref-456"
        assert body_called["EPreferenceInfo"]["CombinedStmtInd"] is False
        assert body_called["EPreferenceInfo"]["EmailLink"] == []


@patch("httpx.post")
def test_update_customer_profile_entitlement_403_fallback(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"

    mock_403 = MagicMock()
    mock_403.status_code = 403
    mock_403.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Forbidden", request=MagicMock(), response=mock_403
    )

    with patch("httpx.put", return_value=mock_403):
        res = service.update_customer_profile(
            "CIF-982341",
            {
                "address": "123 Main St, New York, NY 10001",
                "phone": "1-800-555-0199",
                "email": "test@example.com",
            },
        )

        assert res["success"] is True
        assert res["live_sync_available"] is False
        assert res["fallback_reason"] == "ENTITLEMENT_DENIED"


@patch("httpx.post")
def test_update_customer_profile_business_error_fallback(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"

    mock_biz_err = MagicMock()
    mock_biz_err.status_code = 200
    mock_biz_err.json.return_value = {
        "Status": {
            "StatusCode": 1120,
            "StatusDesc": "Not Entitled to Party Product",
        }
    }

    with patch("httpx.put", return_value=mock_biz_err):
        res = service.update_customer_profile(
            "CIF-982341",
            {
                "address": "123 Main St, New York, NY 10001",
                "phone": "1-800-555-0199",
                "email": "test@example.com",
            },
        )

        assert res["success"] is True
        assert res["live_sync_available"] is False
        assert res["fallback_reason"] == "ENTITLEMENT_DENIED"


@patch("httpx.post")
def test_update_customer_profile_generic_business_error_fallback(
    mock_post, live_settings
):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"

    mock_biz_err = MagicMock()
    mock_biz_err.status_code = 200
    mock_biz_err.json.return_value = {
        "Status": {
            "StatusCode": 9999,
            "StatusDesc": "Generic Core System Error",
        }
    }

    with patch("httpx.put", return_value=mock_biz_err):
        res = service.update_customer_profile(
            "CIF-982341",
            {
                "address": "123 Main St, New York, NY 10001",
                "phone": "1-800-555-0199",
                "email": "test@example.com",
            },
        )

        assert res["success"] is True
        assert res["live_sync_available"] is False
        assert res["fallback_reason"] == "BUSINESS_ERROR"


@patch("httpx.post")
def test_update_customer_profile_transient_retry(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "mock-token"

    mock_put_success = MagicMock()
    mock_put_success.status_code = 200
    mock_put_success.json.return_value = {
        "Status": {"StatusCode": 0, "StatusDesc": "Success"}
    }

    with patch(
        "httpx.put",
        side_effect=[httpx.ConnectError("Connection reset"), mock_put_success],
    ):
        res = service.update_customer_profile(
            "CIF-982341",
            {
                "address": "123 Main St, New York, NY 10001",
                "phone": "1-800-555-0199",
                "email": "test@example.com",
            },
        )

        assert res["success"] is True
        assert res["live_sync_available"] is True
