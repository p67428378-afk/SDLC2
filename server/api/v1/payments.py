import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from server.database import get_db
from server.models import CheckoutSession, Transaction
from server.schemas import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    DigitalWalletPaymentRequest,
    DigitalWalletPaymentResponse,
    TransactionSummary,
    TransactionDetail,
    ExchangeRateResponse,
)
from server.services.currency_service import (
    get_exchange_rate,
    get_all_rates,
    validate_currency,
)
from server.services.stripe_service import create_payment_intent
from server.services.wallet_service import process_digital_wallet_payment
from server.services.audit_service import log_audit_event

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post(
    "/checkout-session", response_model=CheckoutSessionResponse, status_code=200
)
def create_checkout_session(
    payload: CheckoutSessionRequest, request: Request, db: Session = Depends(get_db)
):
    target_currency = validate_currency(payload.currency)
    base_currency = "USD"
    exchange_rate = get_exchange_rate(db, base_currency, target_currency)
    target_amount = round(payload.amount * exchange_rate, 2)

    # Generate Stripe PaymentIntent
    intent = create_payment_intent(
        amount=target_amount,
        currency=target_currency,
        customer_email=payload.customer_email,
    )

    session_token = f"cs_tok_{uuid.uuid4().hex}"
    session_id = f"cs_{uuid.uuid4().hex[:20]}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    # Record checkout session in DB
    cs = CheckoutSession(
        id=session_id,
        session_token=session_token,
        customer_email=payload.customer_email,
        amount=payload.amount,
        currency=target_currency,
        status="PENDING",
        items=[item.model_dump() for item in payload.items] if payload.items else [],
        expires_at=expires_at,
    )
    db.add(cs)

    # Record initial pending transaction
    tx = Transaction(
        payment_intent_id=intent["id"],
        session_id=session_id,
        customer_email=payload.customer_email,
        amount=payload.amount,
        base_currency=base_currency,
        target_currency=target_currency,
        converted_amount=target_amount,
        exchange_rate=exchange_rate,
        payment_method="card",
        status="PENDING",
        refunded_amount=0.0,
        remaining_refundable_balance=target_amount,
    )
    db.add(tx)
    db.commit()
    db.refresh(cs)
    db.refresh(tx)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db=db,
        event_type="checkout_session_created",
        transaction_id=tx.id,
        payload={
            "session_id": session_id,
            "payment_intent_id": intent["id"],
            "amount": payload.amount,
            "target_amount": target_amount,
            "currency": target_currency,
            "customer_email": payload.customer_email,
        },
        ip_address=client_ip,
    )

    return CheckoutSessionResponse(
        session_id=session_id,
        payment_intent_id=intent["id"],
        client_secret=intent["client_secret"],
        base_amount=payload.amount,
        base_currency=base_currency,
        target_amount=target_amount,
        target_currency=target_currency,
        exchange_rate=exchange_rate,
    )


@router.post(
    "/digital-wallet", response_model=DigitalWalletPaymentResponse, status_code=200
)
def pay_with_digital_wallet(
    payload: DigitalWalletPaymentRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    result = process_digital_wallet_payment(
        db=db,
        wallet_type=payload.wallet_type,
        payment_token=payload.payment_token,
        amount=payload.amount,
        currency=payload.currency,
        customer_email=payload.customer_email or "customer@example.com",
        ip_address=client_ip,
    )
    return DigitalWalletPaymentResponse(**result)


@router.get("/rates", response_model=ExchangeRateResponse)
def get_exchange_rates(
    base_currency: str = Query("USD", description="Base currency ISO code"),
    db: Session = Depends(get_db),
):
    base = validate_currency(base_currency)
    rates = get_all_rates(db, base_currency=base)
    return ExchangeRateResponse(
        base_currency=base, rates=rates, timestamp=datetime.now(timezone.utc)
    )


@router.get("/transactions", response_model=List[TransactionSummary])
def list_transactions(
    status: Optional[str] = Query(None, description="Filter by status"),
    currency: Optional[str] = Query(None, description="Filter by currency"),
    search: Optional[str] = Query(None, description="Search by ID or customer email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)
    if status:
        query = query.filter(Transaction.status == status.upper())
    if currency:
        query = query.filter(Transaction.target_currency == currency.upper())
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.id.ilike(search_term),
                Transaction.payment_intent_id.ilike(search_term),
                Transaction.customer_email.ilike(search_term),
            )
        )
    transactions = (
        query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    )

    result = []
    for tx in transactions:
        result.append(
            TransactionSummary(
                id=str(tx.id),
                payment_intent_id=str(tx.payment_intent_id),
                customer_email=str(tx.customer_email),
                amount=float(tx.converted_amount),
                currency=str(tx.target_currency),
                payment_method=str(tx.payment_method),
                status=str(tx.status),
                created_at=tx.created_at,
            )
        )
    return result


@router.get("/transactions/{transaction_id}", response_model=TransactionDetail)
def get_transaction_detail(transaction_id: str, db: Session = Depends(get_db)):
    tx = (
        db.query(Transaction)
        .filter(
            or_(
                Transaction.id == transaction_id,
                Transaction.payment_intent_id == transaction_id,
            )
        )
        .first()
    )

    if not tx:
        raise HTTPException(
            status_code=404, detail=f"Transaction '{transaction_id}' not found."
        )

    return TransactionDetail(
        id=str(tx.id),
        payment_intent_id=str(tx.payment_intent_id),
        customer_email=str(tx.customer_email),
        amount=float(tx.amount),
        base_currency=str(tx.base_currency),
        converted_amount=float(tx.converted_amount),
        target_currency=str(tx.target_currency),
        exchange_rate=float(tx.exchange_rate),
        payment_method=str(tx.payment_method),
        status=str(tx.status),
        refunded_amount=float(tx.refunded_amount),
        remaining_refundable_balance=float(tx.remaining_refundable_balance),
        refunds=tx.refunds,
        created_at=tx.created_at,
    )
