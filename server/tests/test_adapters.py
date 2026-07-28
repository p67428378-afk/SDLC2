import pytest
from server.adapters.fiserv_adapter import FiservAdapter, MOCK_FISERV_ACCOUNTS
from server.adapters.cenlar_adapter import CenlarAdapter, MOCK_CENLAR_MORTGAGES


def test_fiserv_get_eligible_accounts():
    adapter = FiservAdapter()
    accounts = adapter.get_eligible_accounts()
    assert len(accounts) > 0
    assert all(acc["eligible_for_debit"] for acc in accounts)


def test_fiserv_validate_account_success():
    adapter = FiservAdapter()
    acc = adapter.validate_account("ACC-1111")
    assert acc["accountId"] == "ACC-1111"
    assert acc["status"] == "ACTIVE"


def test_fiserv_validate_account_frozen():
    adapter = FiservAdapter()
    with pytest.raises(ValueError, match="FROZEN"):
        adapter.validate_account("ACC-3333")


def test_fiserv_validate_account_not_found():
    adapter = FiservAdapter()
    with pytest.raises(ValueError, match="not found"):
        adapter.validate_account("ACC-9999")


def test_fiserv_get_balance():
    adapter = FiservAdapter()
    balance = adapter.get_balance("ACC-1111")
    assert balance == MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"]


def test_fiserv_debit_success():
    adapter = FiservAdapter()
    # Reset balance for test
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 5000.00
    tx_id = adapter.debit_account("ACC-1111", 100.00, "test-key-1")
    assert tx_id.startswith("FT-FISERV-")
    assert MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] == 4900.00


def test_fiserv_debit_insufficient_funds():
    adapter = FiservAdapter()
    with pytest.raises(ValueError, match="Insufficient funds"):
        adapter.debit_account("ACC-2222", 100.00, "test-key-2")


def test_fiserv_debit_timeout():
    adapter = FiservAdapter()
    with pytest.raises(TimeoutError):
        adapter.debit_account("ACC-4444", 999.00, "test-key-timeout")


def test_fiserv_reverse_debit():
    adapter = FiservAdapter()
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 4900.00
    tx_id = adapter.reverse_debit(
        "ACC-1111", 100.00, "FT-FISERV-123", "test-key-reverse"
    )
    assert tx_id.startswith("REV-FISERV-")
    assert MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] == 5000.00


def test_cenlar_get_mortgage_details():
    adapter = CenlarAdapter()
    details = adapter.get_mortgage_details("MORT-9999")
    assert details["mortgageAccountId"] == "MORT-9999"
    assert (
        details["outstandingBalance"]
        == MOCK_CENLAR_MORTGAGES["MORT-9999"]["outstandingBalance"]
    )


def test_cenlar_post_payment_success():
    adapter = CenlarAdapter()
    MOCK_CENLAR_MORTGAGES["MORT-9999"]["outstandingBalance"] = 245850.00
    tx_id = adapter.post_payment("MORT-9999", 1000.00, "test-key-post")
    assert tx_id.startswith("TX-CENLAR-")
    assert MOCK_CENLAR_MORTGAGES["MORT-9999"]["outstandingBalance"] == 244850.00


def test_cenlar_post_payment_failure():
    adapter = CenlarAdapter()
    with pytest.raises(ValueError, match="Cenlar posting failed"):
        adapter.post_payment("MORT-8888", 1000.00, "test-key-post-fail")
