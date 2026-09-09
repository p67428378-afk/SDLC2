import hashlib
import bcrypt
from datetime import timedelta
from typing import List, Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from server.config import settings
from server.models import (
    Base,
    User,
    Transaction,
    Refund,
    AuditLog,
    ExchangeRateCache,
    get_utc_now,
)


def get_password_hash(password: str) -> str:
    try:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    except Exception:
        return hashlib.sha256(f"salt_{password}".encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    try:
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            return bcrypt.checkpw(
                plain_password.encode("utf-8"), hashed_password.encode("utf-8")
            )
    except Exception:
        pass
    return (
        hashed_password
        == hashlib.sha256(f"salt_{plain_password}".encode("utf-8")).hexdigest()
        or hashed_password == plain_password
    )


database_url = settings.DATABASE_URL

if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    if ":memory:" in database_url or settings.TESTING:
        engine = create_engine(
            database_url,
            connect_args=connect_args,
            poolclass=StaticPool,
        )
    else:
        engine = create_engine(
            database_url,
            connect_args=connect_args,
        )
else:
    engine = create_engine(database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_data(db: Session):
    """Idempotently seeds test users, exchange rates, transactions, refunds, and audit logs."""
    try:
        # 1. Seed Users
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                id="usr_test_user_001",
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                role="customer",
                is_active=True,
                is_verified=True,
            )
            db.add(test_user)

        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = User(
                id="usr_admin_user_001",
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                role="admin",
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)
        db.commit()

        # 2. Seed Exchange Rates
        rates_data = [
            ("USD", "USD", 1.0),
            ("USD", "EUR", 0.9250),
            ("USD", "GBP", 0.7850),
            ("USD", "JPY", 155.20),
            ("USD", "CAD", 1.3650),
            ("EUR", "USD", 1.0810),
            ("GBP", "USD", 1.2738),
            ("JPY", "USD", 0.00644),
            ("CAD", "USD", 0.7326),
        ]
        now = get_utc_now()
        expires = now + timedelta(days=365)
        for base_c, target_c, rate_val in rates_data:
            existing_rate = (
                db.query(ExchangeRateCache)
                .filter(
                    ExchangeRateCache.base_currency == base_c,
                    ExchangeRateCache.target_currency == target_c,
                )
                .first()
            )
            if not existing_rate:
                db.add(
                    ExchangeRateCache(
                        base_currency=base_c,
                        target_currency=target_c,
                        rate=rate_val,
                        expires_at=expires,
                        created_at=now,
                    )
                )
        db.commit()

        # 3. Seed Transactions
        sample_txs: List[Dict[str, Any]] = [
            {
                "id": "tx_1001",
                "payment_intent_id": "pi_1001_mock_intent",
                "customer_email": "test@example.com",
                "amount": 149.99,
                "currency": "USD",
                "base_currency": "USD",
                "target_currency": "USD",
                "converted_amount": 149.99,
                "exchange_rate": 1.0,
                "payment_method": "card",
                "status": "COMPLETED",
                "refunded_amount": 0.0,
                "remaining_refundable_balance": 149.99,
            },
            {
                "id": "tx_1002",
                "payment_intent_id": "pi_1002_mock_intent",
                "customer_email": "jane.doe@example.com",
                "amount": 89.50,
                "currency": "EUR",
                "base_currency": "USD",
                "target_currency": "EUR",
                "converted_amount": 89.50,
                "exchange_rate": 0.9250,
                "payment_method": "apple_pay",
                "status": "COMPLETED",
                "refunded_amount": 0.0,
                "remaining_refundable_balance": 89.50,
            },
            {
                "id": "tx_1003",
                "payment_intent_id": "pi_1003_mock_intent",
                "customer_email": "alice.smith@example.com",
                "amount": 250.00,
                "currency": "USD",
                "base_currency": "USD",
                "target_currency": "USD",
                "converted_amount": 250.00,
                "exchange_rate": 1.0,
                "payment_method": "card",
                "status": "PARTIALLY_REFUNDED",
                "refunded_amount": 50.00,
                "remaining_refundable_balance": 200.00,
            },
            {
                "id": "tx_1004",
                "payment_intent_id": "pi_1004_mock_intent",
                "customer_email": "bob.wilson@example.com",
                "amount": 75.00,
                "currency": "GBP",
                "base_currency": "USD",
                "target_currency": "GBP",
                "converted_amount": 75.00,
                "exchange_rate": 0.7850,
                "payment_method": "google_pay",
                "status": "REFUNDED",
                "refunded_amount": 75.00,
                "remaining_refundable_balance": 0.0,
            },
            {
                "id": "tx_1005",
                "payment_intent_id": "pi_1005_mock_intent",
                "customer_email": "charlie.brown@example.com",
                "amount": 320.00,
                "currency": "USD",
                "base_currency": "USD",
                "target_currency": "USD",
                "converted_amount": 320.00,
                "exchange_rate": 1.0,
                "payment_method": "card",
                "status": "PENDING",
                "refunded_amount": 0.0,
                "remaining_refundable_balance": 320.00,
            },
            {
                "id": "tx_1006",
                "payment_intent_id": "pi_1006_mock_intent",
                "customer_email": "daisuke@example.com",
                "amount": 12500.0,
                "currency": "JPY",
                "base_currency": "USD",
                "target_currency": "JPY",
                "converted_amount": 12500.0,
                "exchange_rate": 155.20,
                "payment_method": "card",
                "status": "COMPLETED",
                "refunded_amount": 0.0,
                "remaining_refundable_balance": 12500.0,
            },
            {
                "id": "tx_1007",
                "payment_intent_id": "pi_1007_mock_intent",
                "customer_email": "emily.clark@example.com",
                "amount": 45.00,
                "currency": "CAD",
                "base_currency": "USD",
                "target_currency": "CAD",
                "converted_amount": 45.00,
                "exchange_rate": 1.3650,
                "payment_method": "card",
                "status": "FAILED",
                "refunded_amount": 0.0,
                "remaining_refundable_balance": 45.00,
            },
        ]

        test_user_id = str(test_user.id) if test_user else "usr_test_user_001"
        for item in sample_txs:
            tx_id = str(item["id"])
            existing_tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
            if not existing_tx:
                db.add(Transaction(user_id=test_user_id, **item))
        db.commit()

        # 4. Seed Refunds
        admin_user_id = str(admin_user.id) if admin_user else "usr_admin_user_001"
        sample_refunds: List[Dict[str, Any]] = [
            {
                "id": "ref_1001",
                "transaction_id": "tx_1003",
                "actor_id": admin_user_id,
                "refund_amount": 50.00,
                "currency": "USD",
                "reason": "Partial return of item",
                "memo": "Customer returned 1 item from bundle",
                "status": "SUCCEEDED",
            },
            {
                "id": "ref_1002",
                "transaction_id": "tx_1004",
                "actor_id": admin_user_id,
                "refund_amount": 75.00,
                "currency": "GBP",
                "reason": "Order cancelled by customer",
                "memo": "Customer requested full refund prior to shipment",
                "status": "SUCCEEDED",
            },
        ]
        for r_item in sample_refunds:
            ref_id = str(r_item["id"])
            existing_ref = db.query(Refund).filter(Refund.id == ref_id).first()
            if not existing_ref:
                db.add(Refund(**r_item))
        db.commit()

        # 5. Seed Audit Logs
        sample_audits: List[Dict[str, Any]] = [
            {
                "id": "aud_1001",
                "transaction_id": "tx_1001",
                "event_type": "payment.checkout_session.created",
                "action": "CHECKOUT_INITIATED",
                "ip_address": "127.0.0.1",
                "user_id": test_user_id,
                "status_code": 200,
                "signature_valid": True,
                "masked_payload": {
                    "cardholder_name": "John Doe",
                    "card_last4": "4242",
                    "amount": 149.99,
                    "currency": "USD",
                },
            },
            {
                "id": "aud_1002",
                "transaction_id": "tx_1003",
                "event_type": "refund.created",
                "action": "PARTIAL_REFUND",
                "ip_address": "127.0.0.1",
                "user_id": admin_user_id,
                "status_code": 200,
                "signature_valid": True,
                "masked_payload": {
                    "transaction_id": "tx_1003",
                    "refund_amount": 50.00,
                    "reason": "Partial return of item",
                },
            },
            {
                "id": "aud_1003",
                "transaction_id": "tx_1001",
                "event_type": "stripe.webhook.payment_intent.succeeded",
                "action": "WEBHOOK_PROCESSED",
                "ip_address": "54.187.174.169",
                "user_id": None,
                "status_code": 200,
                "signature_valid": True,
                "masked_payload": {
                    "payment_intent_id": "pi_1001_mock_intent",
                    "event_type": "payment_intent.succeeded",
                    "status": "succeeded",
                },
            },
        ]
        for a_item in sample_audits:
            aud_id = str(a_item["id"])
            existing_aud = db.query(AuditLog).filter(AuditLog.id == aud_id).first()
            if not existing_aud:
                db.add(AuditLog(**a_item))
        db.commit()

    except Exception:
        db.rollback()


def init_db():
    """Initializes schema and seeds initial data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
