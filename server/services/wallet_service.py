from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models import Transaction
from server.services.currency_service import get_exchange_rate, validate_currency
from server.services.stripe_service import generate_stripe_id
from server.services.audit_service import log_audit_event


def process_digital_wallet_payment(
    db: Session,
    wallet_type: str,
    payment_token: str,
    amount: float,
    currency: str = "USD",
    customer_email: str = "customer@example.com",
    ip_address: Optional[str] = "127.0.0.1",
) -> Dict[str, Any]:
    norm_wallet = wallet_type.lower().strip()
    if norm_wallet not in ["apple_pay", "google_pay", "applepay", "googlepay"]:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported wallet type '{wallet_type}'. Must be 'apple_pay' or 'google_pay'.",
        )

    clean_token = payment_token.strip()
    if not clean_token or any(
        err in clean_token.lower() for err in ["expired", "invalid", "reject", "fail"]
    ):
        raise HTTPException(
            status_code=422,
            detail=f"Digital wallet token for {wallet_type} is invalid or expired.",
        )

    target_currency = validate_currency(currency)
    exchange_rate = get_exchange_rate(
        db, base_currency="USD", target_currency=target_currency
    )
    converted_amount = round(amount * exchange_rate, 2)

    payment_intent_id = generate_stripe_id("pi_wallet")

    transaction = Transaction(
        payment_intent_id=payment_intent_id,
        customer_email=customer_email,
        amount=amount,
        base_currency="USD",
        target_currency=target_currency,
        converted_amount=converted_amount,
        exchange_rate=exchange_rate,
        payment_method=norm_wallet,
        status="COMPLETED",
        refunded_amount=0.0,
        remaining_refundable_balance=converted_amount,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    log_audit_event(
        db=db,
        event_type="wallet_payment_success",
        transaction_id=transaction.id,
        payload={
            "wallet_type": norm_wallet,
            "payment_token": clean_token,
            "amount": amount,
            "currency": target_currency,
            "converted_amount": converted_amount,
            "customer_email": customer_email,
        },
        ip_address=ip_address,
    )

    return {
        "transaction_id": transaction.id,
        "payment_intent_id": transaction.payment_intent_id,
        "status": transaction.status,
        "amount": transaction.amount,
        "currency": transaction.target_currency,
        "wallet_type": norm_wallet,
    }
