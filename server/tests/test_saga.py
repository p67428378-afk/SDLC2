import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from server.models import Payment, PaymentAuditLog
from server.services.saga_orchestrator import SagaOrchestrator
from server.workers.saga_recovery_worker import recover_stuck_sagas
from server.adapters.fiserv_adapter import (
    MOCK_FISERV_ACCOUNTS,
    MOCK_FISERV_TRANSACTIONS,
)
from server.adapters.cenlar_adapter import (
    MOCK_CENLAR_MORTGAGES,
    MOCK_CENLAR_TRANSACTIONS,
)


def test_saga_success(db_session: Session):
    # Reset mock databases
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 5000.00
    MOCK_CENLAR_MORTGAGES["MORT-9999"]["outstandingBalance"] = 245850.00
    MOCK_FISERV_TRANSACTIONS.clear()
    MOCK_CENLAR_TRANSACTIONS.clear()

    payment = Payment(
        customer_id="CUST-1001",
        source_account_id="ACC-1111",
        mortgage_account_id="MORT-9999",
        amount=1000.00,
        status="PENDING",
        payment_type="IMMEDIATE",
        transaction_reference="TX-SAGA-SUCCESS",
    )
    db_session.add(payment)
    db_session.commit()

    orchestrator = SagaOrchestrator(db_session)
    updated_payment = orchestrator.execute_payment_saga(payment)

    assert updated_payment.status == "COMPLETED"
    assert updated_payment.fiserv_transaction_id is not None
    assert updated_payment.cenlar_transaction_id is not None
    assert MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] == 4000.00
    assert MOCK_CENLAR_MORTGAGES["MORT-9999"]["outstandingBalance"] == 244850.00

    # Check audit logs
    logs = (
        db_session.query(PaymentAuditLog)
        .filter(PaymentAuditLog.payment_id == payment.id)
        .all()
    )
    assert len(logs) == 2
    assert any(
        log.step_name == "DEBIT_FISERV" and log.status == "SUCCESS" for log in logs
    )
    assert any(
        log.step_name == "POST_CENLAR" and log.status == "SUCCESS" for log in logs
    )


def test_saga_cenlar_failure_after_debit(db_session: Session):
    # Reset mock databases
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 5000.00
    MOCK_CENLAR_MORTGAGES["MORT-8888"]["outstandingBalance"] = 150000.00
    MOCK_FISERV_TRANSACTIONS.clear()
    MOCK_CENLAR_TRANSACTIONS.clear()

    payment = Payment(
        customer_id="CUST-1001",
        source_account_id="ACC-1111",
        mortgage_account_id="MORT-8888",  # This mortgage will fail posting
        amount=1000.00,
        status="PENDING",
        payment_type="IMMEDIATE",
        transaction_reference="TX-SAGA-FAIL",
    )
    db_session.add(payment)
    db_session.commit()

    orchestrator = SagaOrchestrator(db_session)
    with pytest.raises(
        ValueError, match="Payment posting failed. Funds have been reversed"
    ):
        orchestrator.execute_payment_saga(payment)

    # Verify payment status is REVERSED and funds are returned
    db_session.refresh(payment)
    assert payment.status == "REVERSED"
    assert payment.fiserv_transaction_id is not None
    assert payment.reversal_transaction_id is not None
    assert MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] == 5000.00  # Returned!
    assert (
        MOCK_CENLAR_MORTGAGES["MORT-8888"]["outstandingBalance"] == 150000.00
    )  # Unchanged

    # Check audit logs
    logs = (
        db_session.query(PaymentAuditLog)
        .filter(PaymentAuditLog.payment_id == payment.id)
        .all()
    )
    assert len(logs) == 3
    assert any(
        log.step_name == "DEBIT_FISERV" and log.status == "SUCCESS" for log in logs
    )
    assert any(
        log.step_name == "POST_CENLAR" and log.status == "FAILURE" for log in logs
    )
    assert any(
        log.step_name == "REVERSE_DEBIT" and log.status == "SUCCESS" for log in logs
    )


def test_saga_recovery_worker_completed(db_session: Session):
    MOCK_FISERV_TRANSACTIONS.clear()
    MOCK_CENLAR_TRANSACTIONS.clear()

    # Simulate a payment stuck in PROCESSING
    payment = Payment(
        customer_id="CUST-1001",
        source_account_id="ACC-1111",
        mortgage_account_id="MORT-9999",
        amount=1000.00,
        status="PROCESSING",
        payment_type="IMMEDIATE",
        transaction_reference="TX-SAGA-RECOVER-COMP",
        updated_at=datetime.utcnow() - timedelta(minutes=20),  # Stuck for 20 mins
    )
    db_session.add(payment)
    db_session.commit()

    # Mock successful transactions in external systems
    debit_key = f"{payment.transaction_reference}:debit"
    post_key = f"{payment.transaction_reference}:post"
    MOCK_FISERV_TRANSACTIONS[debit_key] = {
        "status": "SUCCESS",
        "tx_id": "FT-FISERV-RECOVERED",
        "amount": 1000.00,
        "account_id": "ACC-1111",
    }
    MOCK_CENLAR_TRANSACTIONS[post_key] = {
        "status": "SUCCESS",
        "tx_id": "TX-CENLAR-RECOVERED",
        "amount": 1000.00,
        "mortgage_account_id": "MORT-9999",
    }

    recover_stuck_sagas(db_session, timeout_minutes=15)

    db_session.refresh(payment)
    assert payment.status == "COMPLETED"
    assert payment.fiserv_transaction_id == "FT-FISERV-RECOVERED"
    assert payment.cenlar_transaction_id == "TX-CENLAR-RECOVERED"


def test_saga_recovery_worker_reversed(db_session: Session):
    MOCK_FISERV_TRANSACTIONS.clear()
    MOCK_CENLAR_TRANSACTIONS.clear()
    MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] = 5000.00

    # Simulate a payment stuck in PROCESSING
    payment = Payment(
        customer_id="CUST-1001",
        source_account_id="ACC-1111",
        mortgage_account_id="MORT-9999",
        amount=1000.00,
        status="PROCESSING",
        payment_type="IMMEDIATE",
        transaction_reference="TX-SAGA-RECOVER-REV",
        updated_at=datetime.utcnow() - timedelta(minutes=20),
    )
    db_session.add(payment)
    db_session.commit()

    # Mock successful debit but failed posting
    debit_key = f"{payment.transaction_reference}:debit"
    post_key = f"{payment.transaction_reference}:post"
    MOCK_FISERV_TRANSACTIONS[debit_key] = {
        "status": "SUCCESS",
        "tx_id": "FT-FISERV-RECOVERED",
        "amount": 1000.00,
        "account_id": "ACC-1111",
    }
    MOCK_CENLAR_TRANSACTIONS[post_key] = {
        "status": "FAILED",
        "tx_id": None,
        "amount": 1000.00,
        "mortgage_account_id": "MORT-9999",
        "error": "System error",
    }

    recover_stuck_sagas(db_session, timeout_minutes=15)

    db_session.refresh(payment)
    assert payment.status == "REVERSED"
    assert payment.reversal_transaction_id is not None
    assert (
        MOCK_FISERV_ACCOUNTS["ACC-1111"]["balance"] == 6000.00
    )  # Reversed (added 1000 to 5000)
