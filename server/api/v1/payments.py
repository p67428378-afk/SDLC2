from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.checkout_session import CheckoutSession
from server.models.transaction import Transaction
from server.schemas.payment import (
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    DigitalWalletRequest,
    DigitalWalletResponse,
    TransactionResponse,
)
from server.services.currency_service import convert_currency, get_exchange_rate
from server.services.stripe_service import create_payment_intent
from server.services.wallet_service import process_digital_wallet_payment
from server.services.audit_service import log_audit_event
from server.dependencies.auth import get_actor_identity

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post(
    "/checkout-session",
    response_model=CheckoutSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Checkout Session with Multi-Currency Conversion",
)
def create_checkout_session(
    payload: CheckoutSessionCreate,
    request: Request,
    db: Session = Depends(get_db),
    actor_id: str = Depends(get_actor_identity),
):
    target_currency = (payload.target_currency or payload.currency).upper()
    source_currency = payload.currency.upper()

    # 1. Multi-currency conversion
    converted_amount, rate = convert_currency(
        db=db,
        amount=payload.amount,
        source_currency=source_currency,
        target_currency=target_currency,
    )

    # 2. Create Stripe PaymentIntent
    intent = create_payment_intent(
        amount=converted_amount,
        currency=target_currency,
        description=payload.description,
        metadata={"customer_id": payload.customer_id},
    )

    # 3. Save Checkout Session
    session = CheckoutSession(
        customer_id=payload.customer_id,
        amount_original=payload.amount,
        currency_original=source_currency,
        amount_converted=converted_amount,
        currency_target=target_currency,
        exchange_rate=rate,
        status="CREATED",
        description=payload.description,
        payment_intent_id=intent["id"],
        client_secret=intent["client_secret"],
    )
    db.add(session)
    try:
        db.commit()
        db.refresh(session)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

    # 4. PCI Audit Logging
    client_ip = request.client.host if request.client else None
    log_audit_event(
        db=db,
        action="CHECKOUT_SESSION_CREATED",
        actor_id=actor_id,
        payload={
            "session_id": session.id,
            "customer_id": payload.customer_id,
            "amount_original": payload.amount,
            "currency_original": source_currency,
            "amount_converted": converted_amount,
            "currency_target": target_currency,
            "exchange_rate": rate,
            "payment_intent_id": intent["id"],
        },
        ip_address=client_ip,
    )

    return CheckoutSessionResponse(
        session_id=session.id,
        payment_intent_id=session.payment_intent_id,
        client_secret=session.client_secret,
        amount_original=session.amount_original,
        currency_original=session.currency_original,
        amount_converted=session.amount_converted,
        currency_target=session.currency_target,
        exchange_rate=session.exchange_rate,
        status=session.status,
        created_at=session.created_at,
    )


@router.post(
    "/digital-wallet",
    response_model=DigitalWalletResponse,
    status_code=status.HTTP_200_OK,
    summary="Process Digital Wallet Payment (Apple Pay / Google Pay)",
)
def process_digital_wallet(
    payload: DigitalWalletRequest,
    request: Request,
    db: Session = Depends(get_db),
    actor_id: str = Depends(get_actor_identity),
):
    client_ip = request.client.host if request.client else None
    transaction = process_digital_wallet_payment(
        db=db,
        session_id=payload.session_id,
        wallet_provider=payload.wallet_provider,
        token=payload.token,
        actor_id=actor_id,
        ip_address=client_ip,
    )

    return DigitalWalletResponse(
        transaction_id=transaction.id,
        status=transaction.status,
        wallet_provider=transaction.payment_method_type,
        masked_account=transaction.masked_card_details
        or f"{payload.wallet_provider} ****1111",
        created_at=transaction.created_at,
    )


@router.get(
    "/transactions/{transaction_id}",
    response_model=TransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Transaction Status & Details",
)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    refund_items = [
        {
            "refund_id": r.stripe_refund_id or r.id,
            "amount": r.amount,
            "status": r.status,
            "created_at": r.created_at,
        }
        for r in tx.refunds
    ]

    return TransactionResponse(
        transaction_id=tx.id,
        session_id=tx.session_id,
        payment_intent_id=tx.stripe_payment_intent_id,
        amount=tx.amount,
        currency=tx.currency,
        status=tx.status,
        payment_method_type=tx.payment_method_type,
        masked_account=tx.masked_card_details,
        customer_id=tx.customer_id,
        refunds=refund_items,
        created_at=tx.created_at,
        updated_at=tx.updated_at,
    )


@router.get(
    "/transactions",
    response_model=List[TransactionResponse],
    status_code=status.HTTP_200_OK,
    summary="List Transactions",
)
def list_transactions(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)
    if status_filter:
        query = query.filter(Transaction.status == status_filter.upper())
    if customer_id:
        query = query.filter(Transaction.customer_id == customer_id)

    transactions = (
        query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    )

    result = []
    for tx in transactions:
        refund_items = [
            {
                "refund_id": r.stripe_refund_id or r.id,
                "amount": r.amount,
                "status": r.status,
                "created_at": r.created_at,
            }
            for r in tx.refunds
        ]
        result.append(
            TransactionResponse(
                transaction_id=tx.id,
                session_id=tx.session_id,
                payment_intent_id=tx.stripe_payment_intent_id,
                amount=tx.amount,
                currency=tx.currency,
                status=tx.status,
                payment_method_type=tx.payment_method_type,
                masked_account=tx.masked_card_details,
                customer_id=tx.customer_id,
                refunds=refund_items,
                created_at=tx.created_at,
                updated_at=tx.updated_at,
            )
        )
    return result


@router.get(
    "/rates",
    status_code=status.HTTP_200_OK,
    summary="Get Active Currency Exchange Rate",
)
def get_rate(base: str = "USD", target: str = "EUR", db: Session = Depends(get_db)):
    rate, is_cached = get_exchange_rate(db, base, target)
    return {
        "base_currency": base.upper(),
        "target_currency": target.upper(),
        "exchange_rate": rate,
        "is_cached": is_cached,
    }
