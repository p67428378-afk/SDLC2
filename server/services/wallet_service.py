from typing import Dict, Any, Union
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models.checkout_session import CheckoutSession
from server.models.transaction import Transaction
from server.services.audit_service import log_audit_event


def parse_masked_wallet_account(
    token_data: Union[Dict[str, Any], str], provider: str
) -> str:
    if isinstance(token_data, dict):
        # Apple Pay structure: {"paymentMethod": {"displayName": "Visa 1111", "network": "Visa"}}
        pm = token_data.get("paymentMethod", {})
        if isinstance(pm, dict) and pm.get("displayName"):
            return str(pm.get("displayName"))
        if isinstance(pm, dict) and pm.get("network"):
            return f"{pm.get('network')} ****"

        # Google Pay structure: {"description": "Visa •••• 1111"}
        if token_data.get("description"):
            return str(token_data.get("description"))
        if token_data.get("cardDetails"):
            return f"Card ****{str(token_data.get('cardDetails'))[-4:]}"

    return f"{provider.title()} ****1111"


def process_digital_wallet_payment(
    db: Session,
    session_id: str,
    wallet_provider: str,
    token: Union[Dict[str, Any], str],
    actor_id: str = "system",
    ip_address: str = None,
) -> Transaction:
    # 1. Fetch checkout session
    session = db.query(CheckoutSession).filter(CheckoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Checkout session not found")

    if session.status != "CREATED":
        raise HTTPException(
            status_code=400,
            detail=f"Checkout session is in invalid state: {session.status}",
        )

    # 2. Validate token
    if not token or (isinstance(token, dict) and not token):
        raise HTTPException(
            status_code=422, detail="Invalid or empty digital wallet token"
        )

    # Check for expired or rejected simulation
    if isinstance(token, dict):
        if token.get("status") in ("expired", "rejected", "invalid"):
            raise HTTPException(
                status_code=422,
                detail=f"Digital wallet token rejected: {token.get('status')}",
            )
        if token.get("expired") is True:
            raise HTTPException(
                status_code=422, detail="Digital wallet token has expired"
            )

    # 3. Extract masked account details
    masked_account = parse_masked_wallet_account(token, wallet_provider)

    # 4. Create Transaction
    transaction = Transaction(
        session_id=session.id,
        stripe_payment_intent_id=session.payment_intent_id,
        payment_method_type=wallet_provider,
        amount=session.amount_converted,
        currency=session.currency_target,
        status="AUTHORIZED",
        masked_card_details=masked_account,
        customer_id=session.customer_id,
    )
    db.add(transaction)

    # Mark session as completed
    session.status = "COMPLETED"

    try:
        db.commit()
        db.refresh(transaction)
    except Exception:
        db.rollback()
        raise

    # 5. Log PCI Audit Event
    log_audit_event(
        db=db,
        action="WALLET_PAYMENT_AUTHORIZED",
        actor_id=actor_id,
        payload={
            "session_id": session.id,
            "wallet_provider": wallet_provider,
            "masked_account": masked_account,
            "amount": transaction.amount,
            "currency": transaction.currency,
            "token": token,
        },
        transaction_id=transaction.id,
        ip_address=ip_address,
    )

    return transaction
