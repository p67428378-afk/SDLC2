import json
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
        FISERV_TOKEN_URL="https://bankinghub-cert.fiservapis.com/fts-apim/oauth2/v2",
        FISERV_BASE_URL="https://bankinghub-cert.fiservapis.com/banking/efx/v1",
        FISERV_ORG_ID="999990301",
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

    # Second call should use cached token without extra POST
    mock_post.reset_mock()
    token2 = service._get_token()
    assert token2 == "mock-access-token"
    mock_post.assert_not_called()


@patch("httpx.post")
def test_get_token_string_expires_in(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_response = MagicMock()
    mock_response.status_code = 200
    # Fiserv returns expires_in as string "3600"
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
            "SvcProviderName": "Premier",
        },
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
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
    assert accounts[0]["type"] == "DDA"
    assert accounts[0]["balance"] == 15000.50
    assert accounts[0]["account_number"] == "•••• 1733"
    assert accounts[0]["status"] == "Active"
    assert "raw_source" in accounts[0]
    assert accounts[0]["raw_source"] == mock_acct_resp.json.return_value

    # Verify call parameters sent to Fiserv
    account_calls = mock_post.call_args_list[1:]
    assert len(account_calls) == 3

    # Check headers (EFXHeader formatted as JSON string)
    headers0 = account_calls[0].kwargs.get("headers", {})
    assert "EFXHeader" in headers0
    efx_header = json.loads(headers0["EFXHeader"])
    assert efx_header["OrganizationId"] == "999990301"
    assert "TrnId" in efx_header
    assert headers0["Authorization"] == "Bearer mock-access-token"

    # Check payload structure for account 0 (DDA -> DDA): AcctKeys is OBJECT, no IncCtrlList
    body0 = account_calls[0].kwargs.get("json", {})
    assert body0 == {
        "AcctSel": {
            "AcctKeys": {
                "AcctId": "5041733",
                "AcctType": "DDA",
            }
        }
    }
    assert "IncCtrlList" not in body0

    # Check payload structure for account 1 (Savings -> SDA)
    body1 = account_calls[1].kwargs.get("json", {})
    assert body1 == {
        "AcctSel": {
            "AcctKeys": {
                "AcctId": "302034131",
                "AcctType": "SDA",
            }
        }
    }

    # Check payload structure for account 2 (CD -> CDA)
    body2 = account_calls[2].kwargs.get("json", {})
    assert body2 == {
        "AcctSel": {
            "AcctKeys": {
                "AcctId": "290001702",
                "AcctType": "CDA",
            }
        }
    }


@patch("httpx.post")
def test_get_accounts_parses_live_fiserv_data(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": "3600",
    }

    mock_dda_resp = MagicMock()
    mock_dda_resp.status_code = 200
    mock_dda_resp.json.return_value = {
        "Status": {"StatusCode": "0", "StatusDesc": "Success"},
        "AcctRec": {
            "DepositAcctInfo": {
                "Nickname": "Premier Checking",
                "Rate": "0.0",
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 12500.50}}],
            }
        },
    }

    mock_sav_resp = MagicMock()
    mock_sav_resp.status_code = 200
    mock_sav_resp.json.return_value = {
        "Status": {"StatusCode": "0", "StatusDesc": "Success"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctTitle": "High Yield Savings",
                "Rate": "5.5",
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 45000.00}}],
            }
        },
    }

    mock_cd_resp = MagicMock()
    mock_cd_resp.status_code = 200
    mock_cd_resp.json.return_value = {
        "Status": {"StatusCode": "0", "StatusDesc": "Success"},
        "AcctRec": {
            "DepositAcctInfo": {
                "Nickname": "12-Month CD",
                "Rate": "4.5",
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 10000.00}}],
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_dda_resp,
        mock_sav_resp,
        mock_cd_resp,
    ]

    accounts = service.get_accounts("CIF-982341")
    assert len(accounts) == 3

    # Checking account
    assert accounts[0]["id"] == "5041733"
    assert accounts[0]["name"] == "Premier Checking"
    assert accounts[0]["interest_rate"] == 0.0
    assert accounts[0]["status"] == "Active"
    assert accounts[0]["transactions"] == []
    assert accounts[0]["raw_source"] == mock_dda_resp.json.return_value

    # Savings account
    assert accounts[1]["id"] == "302034131"
    assert accounts[1]["name"] == "High Yield Savings"
    assert accounts[1]["interest_rate"] == 5.5
    assert accounts[1]["status"] == "Active"
    assert accounts[1]["transactions"] == []
    assert accounts[1]["raw_source"] == mock_sav_resp.json.return_value

    # CD account
    assert accounts[2]["id"] == "290001702"
    assert accounts[2]["name"] == "12-Month CD"
    assert accounts[2]["interest_rate"] == 4.5
    assert accounts[2]["status"] == "Active"
    assert accounts[2]["transactions"] == []
    assert accounts[2]["raw_source"] == mock_cd_resp.json.return_value


@patch("httpx.post")
def test_get_accounts_loan_type_exclusion(mock_post, live_settings):
    settings = Settings(
        FISERV_MODE="live",
        FISERV_API_KEY="test-key",
        FISERV_API_SECRET="test-secret",
        FISERV_TOKEN_URL="https://bankinghub-cert.fiservapis.com/fts-apim/oauth2/v2",
        FISERV_BASE_URL="https://bankinghub-cert.fiservapis.com/banking/efx/v1",
        FISERV_ORG_ID="999990301",
        FISERV_DEMO_ACCOUNTS="6080:Loan",
    )
    service = FiservLiveService(settings)

    accounts = service.get_accounts("CIF-982341")
    assert len(accounts) == 0


@patch("httpx.post")
def test_get_accounts_business_error_handling(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_business_err = MagicMock()
    mock_business_err.status_code = 200
    mock_business_err.json.return_value = {
        "Status": {
            "StatusCode": "1120",
            "StatusDesc": "No Records Match Selection Criteria",
            "Severity": "Info",
            "SvcProviderName": "Premier",
            "ServerStatusCode": "9999",
            "ServerStatusDesc": "Account Number Not On File",
        }
    }

    mock_acct_success = MagicMock()
    mock_acct_success.status_code = 200
    mock_acct_success.json.return_value = {
        "Status": {"StatusCode": "0", "StatusDesc": "Success"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 500.0}}]
            }
        },
    }

    mock_post.side_effect = [
        mock_token_resp,
        mock_business_err,
        mock_acct_success,
        mock_acct_success,
    ]

    accounts = service.get_accounts("CIF-982341")
    assert len(accounts) == 2
    assert accounts[0]["id"] == "302034131"


@patch("httpx.post")
def test_get_accounts_graceful_degradation(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }

    mock_acct_success = MagicMock()
    mock_acct_success.status_code = 200
    mock_acct_success.json.return_value = {
        "Status": {"StatusCode": "0", "StatusDesc": "Success"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 100.0}}]
            }
        },
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
    assert len(accounts) == 2
    assert accounts[0]["id"] == "5041733"
    assert accounts[1]["id"] == "290001702"


@patch("httpx.post")
def test_token_refresh_on_401(mock_post, live_settings):
    service = FiservLiveService(live_settings)
    service._token = "expired-token"

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
        "Status": {"StatusCode": "0", "StatusDesc": "Success"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 500.0}}]
            }
        },
    }

    mock_post.side_effect = [mock_401, mock_token, mock_success]

    url = f"{service.base_url}/acctservice/acctmgmt/accounts/secured"
    res = service._make_api_call(url, {})
    assert res["AcctRec"]["DepositAcctInfo"]["AcctBal"][0]["CurAmt"]["Amt"] == 500.0
    assert service._token == "new-token"


def test_raw_source_in_live_and_mock_mode(live_settings):
    live_service = FiservLiveService(live_settings)
    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {"access_token": "token", "expires_in": 3600}

    mock_acct_resp = MagicMock()
    mock_acct_resp.status_code = 200
    mock_acct_resp.json.return_value = {
        "Status": {"StatusCode": "0", "StatusDesc": "Success"},
        "AcctRec": {
            "DepositAcctInfo": {
                "AcctDtlStatus": "Active",
                "AcctBal": [{"BalType": "Current", "CurAmt": {"Amt": 100.0}}],
            }
        },
    }

    # Provide enough responses for both get_accounts calls (1 token + 3 accts + 1 cached_token + 3 accts)
    responses = [mock_token_resp] + [mock_acct_resp] * 10
    with patch("httpx.post", side_effect=responses):
        accounts = live_service.get_accounts("CIF-982341")
        assert len(accounts) == 3
        assert "raw_source" in accounts[0]
        assert accounts[0]["raw_source"] == mock_acct_resp.json.return_value

        account_details = live_service.get_account_details("CIF-982341", "5041733")
        assert account_details is not None
        assert "raw_source" in account_details
        assert account_details["raw_source"] == mock_acct_resp.json.return_value

    mock_service = FiservMockService()
    mock_accounts = mock_service.get_accounts("CIF-982341")
    assert len(mock_accounts) > 0
    assert "raw_source" not in mock_accounts[0]

    mock_details = mock_service.get_account_details("CIF-982341", "fiserv-dda-1")
    assert mock_details is not None
    assert "raw_source" not in mock_details


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
    with patch("server.config.settings.FISERV_MODE", "mock"):
        import server.services.fiserv

        server.services.fiserv._service_instance = None
        service = get_core_banking_service()
        assert isinstance(service, FiservMockService)
        assert not isinstance(service, FiservLiveService)

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
