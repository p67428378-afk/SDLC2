import json
import pytest
import httpx
from unittest.mock import patch, MagicMock
from server.config import Settings
from server.services.fiserv import (
    FiservLiveService,
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

    account_calls = mock_post.call_args_list[1:]
    assert len(account_calls) == 3

    headers0 = account_calls[0].kwargs.get("headers", {})
    assert "EFXHeader" in headers0
    efx_header = json.loads(headers0["EFXHeader"])
    assert efx_header["OrganizationId"] == "999990301"
    assert "TrnId" in efx_header
    assert headers0["Authorization"] == "Bearer mock-access-token"

    body0 = account_calls[0].kwargs.get("json", {})
    assert body0 == {
        "AcctSel": {
            "AcctKeys": {
                "AcctId": "5041733",
                "AcctType": "DDA",
            }
        }
    }


@patch("httpx.post")
def test_update_customer_profile_live_success(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }
    mock_post.return_value = mock_token_resp

    mock_put_resp = MagicMock()
    mock_put_resp.status_code = 200
    mock_put_resp.json.return_value = {
        "PartyId": "CIF-982341",
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
        assert body_called["PartyId"] == "CIF-982341"
        assert body_called["Addresses"][0]["Line1"] == "789 Main St, Dallas, TX 75201"
        assert body_called["PhoneNumbers"][0]["PhoneNumber"] == "1-555-123-4567"
        assert (
            body_called["EmailAddresses"][0]["EmailAddress"] == "jane.new@example.com"
        )


@patch("httpx.post")
def test_update_communication_preferences_live_success(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }
    mock_post.return_value = mock_token_resp

    mock_put_resp = MagicMock()
    mock_put_resp.status_code = 200
    mock_put_resp.json.return_value = {
        "PartyId": "CIF-982341",
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

        mock_put.assert_called_once()
        url_called = mock_put.call_args[0][0]
        assert (
            url_called
            == "https://bankinghub-cert.fiservapis.com/banking/efx/v1/epreferenceservice/epreference/ePreferences"
        )

        body_called = mock_put.call_args.kwargs["json"]
        assert body_called["PartyId"] == "CIF-982341"
        assert body_called["EPreferences"]["PaperlessDelivery"] is True
        assert body_called["EPreferences"]["MarketingOptIn"] is False


@patch("httpx.post")
def test_update_customer_profile_entitlement_403_fallback(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }
    mock_post.return_value = mock_token_resp

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

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }
    mock_post.return_value = mock_token_resp

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
def test_update_customer_profile_transient_retry(mock_post, live_settings):
    service = FiservLiveService(live_settings)

    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {
        "access_token": "mock-access-token",
        "expires_in": 3600,
    }
    mock_post.return_value = mock_token_resp

    mock_put_success = MagicMock()
    mock_put_success.status_code = 200
    mock_put_success.json.return_value = {
        "Status": {"StatusCode": 0, "StatusDesc": "Success"}
    }

    # First attempt raises ConnectError, second attempt succeeds
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
