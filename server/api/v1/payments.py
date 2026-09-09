import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.database import get_db, seed_data
from server.models import CheckoutSession, Transaction, get_utc_now
from server.schemas import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    DigitalWalletPaymentRequest,
    TransactionSummary,
    TransactionDetail,
    ExchangeRateResponse,
    RefundSummary,
)
from server.services.currency_service import CurrencyService, SUPPORTED_CURRENCIES
from server.services.stripe_service import StripeService
from server.services.wallet_service import WalletService
from server.services.audit_service import AuditService

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post(
    "/checkout-session",
    response_model=CheckoutSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_checkout_session(req: CheckoutSessionRequest, db: Session = Depends(get_db)):
    target_currency = req.currency.upper()
    if target_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported currency: {req.currency}. Supported currencies are: {', '.join(SUPPORTED_CURRENCIES)}",
        )

    base_amount = req.amount
    base_currency = "USD"
    target_amount, exchange_rate = CurrencyService.convert_amount(
        base_amount, base_currency, target_currency, db
    )

    # Create Stripe PaymentIntent
    intent = StripeService.create_payment_intent(
        amount=target_amount,
        currency=target_currency,
        customer_email=req.customer_email,
        metadata={"customer_email": req.customer_email or ""},
    )

    session_id = f"cs_{uuid.uuid4().hex[:16]}"
    payment_intent_id = intent.get("id")
    client_secret = intent.get("client_secret")

    # Persist checkout session
    items_data = [item.model_dump() for item in req.items] if req.items else None
    session_record = CheckoutSession(
        id=str(uuid.uuid4()),
        session_id=session_id,
        payment_intent_id=payment_intent_id,
        customer_email=req.customer_email,
        base_amount=base_amount,
        base_currency=base_currency,
        target_amount=target_amount,
        target_currency=target_currency,
        exchange_rate=exchange_rate,
        client_secret=client_secret,
        status="COMPLETED",
        items=items_data,
        created_at=get_utc_now(),
    )
    db.add(session_record)

    # Persist transaction
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    tx_record = Transaction(
        id=tx_id,
        payment_intent_id=payment_intent_id,
        customer_email=req.customer_email or "customer@example.com",
        amount=target_amount,
        currency=target_currency,
        base_currency=base_currency,
        target_currency=target_currency,
        converted_amount=target_amount,
        exchange_rate=exchange_rate,
        payment_method="card",
        status="COMPLETED",
        refunded_amount=0.0,
        remaining_refundable_balance=target_amount,
        created_at=get_utc_now(),
    )
    db.add(tx_record)
    db.commit()

    # Log PCI compliant audit event
    AuditService.log_event(
        db=db,
        event_type="payment.checkout_session.created",
        action="CHECKOUT_INITIATED",
        transaction_id=tx_id,
        status_code=201,
        raw_payload={
            "session_id": session_id,
            "payment_intent_id": payment_intent_id,
            "cardholder_name": req.cardholder_name,
            "card_number": req.card_number,
            "amount": target_amount,
            "currency": target_currency,
        },
    )

    return CheckoutSessionResponse(
        session_id=session_id,
        payment_intent_id=payment_intent_id,
        client_secret=client_secret,
        base_amount=base_amount,
        base_currency=base_currency,
        target_amount=target_amount,
        target_currency=target_currency,
        exchange_rate=exchange_rate,
    )


@router.post("/digital-wallet", status_code=status.HTTP_201_CREATED)
def process_digital_wallet_payment(
    req: DigitalWalletPaymentRequest, db: Session = Depends(get_db)
):
    target_currency = req.currency.upper()
    if target_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported currency: {req.currency}",
        )

    wallet_res = WalletService.process_wallet_payment(
        wallet_type=req.wallet_type,
        payment_token=req.payment_token,
        amount=req.amount,
        currency=target_currency,
    )

    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    tx_record = Transaction(
        id=tx_id,
        payment_intent_id=wallet_res.get("payment_intent_id"),
        customer_email=req.customer_email or "wallet.user@example.com",
        amount=req.amount,
        currency=target_currency,
        base_currency="USD",
        target_currency=target_currency,
        converted_amount=req.amount,
        exchange_rate=1.0,
        payment_method=wallet_res.get("wallet_type", req.wallet_type),
        status="COMPLETED",
        refunded_amount=0.0,
        remaining_refundable_balance=req.amount,
        created_at=get_utc_now(),
    )
    db.add(tx_record)
    db.commit()

    AuditService.log_event(
        db=db,
        event_type="payment.digital_wallet.charged",
        action="WALLET_CHARGE_SUCCESS",
        transaction_id=tx_id,
        status_code=201,
        raw_payload={
            "wallet_type": req.wallet_type,
            "payment_token": req.payment_token,
            "amount": req.amount,
            "currency": target_currency,
        },
    )

    return {
        "status": "COMPLETED",
        "transaction_id": tx_id,
        "payment_intent_id": wallet_res.get("payment_intent_id"),
        "amount": req.amount,
        "currency": target_currency,
        "payment_method": wallet_res.get("wallet_type", req.wallet_type),
    }


@router.get("/transactions", response_model=List[TransactionSummary])
def list_transactions(
    status_filter: Optional[str] = Query(None, alias="status"),
    customer_email: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    if db.query(Transaction).count() == 0:
        seed_data(db)

    query = db.query(Transaction)
    if status_filter:
        query = query.filter(Transaction.status == status_filter.upper())
    if customer_email:
        query = query.filter(Transaction.customer_email.ilike(f"%{customer_email}%"))

    transactions = (
        query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    )

    return [
        TransactionSummary(
            id=str(tx.id),
            payment_intent_id=str(tx.payment_intent_id)
            if tx.payment_intent_id
            else None,
            customer_email=str(tx.customer_email) if tx.customer_email else None,
            amount=float(tx.amount),
            currency=str(tx.currency),
            payment_method=str(tx.payment_method),
            status=str(tx.status),
            created_at=tx.created_at.isoformat()
            if tx.created_at
            else get_utc_now().isoformat(),
        )
        for tx in transactions
    ]


@router.get("/transactions/{transaction_id}", response_model=TransactionDetail)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    if db.query(Transaction).count() == 0:
        seed_data(db)

    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found",
        )

    refund_summaries = [
        RefundSummary(
            id=str(r.id),
            transaction_id=str(r.transaction_id),
            refund_amount=float(r.refund_amount),
            currency=str(r.currency),
            reason=str(r.reason),
            status=str(r.status),
            created_at=r.created_at.isoformat()
            if r.created_at
            else get_utc_now().isoformat(),
        )
        for r in tx.refunds
    ]

    rem_bal = (
        float(tx.remaining_refundable_balance)
        if tx.remaining_refundable_balance is not None
        else (float(tx.amount) - float(tx.refunded_amount or 0.0))
    )

    return TransactionDetail(
        id=str(tx.id),
        payment_intent_id=str(tx.payment_intent_id) if tx.payment_intent_id else None,
        customer_email=str(tx.customer_email) if tx.customer_email else None,
        amount=float(tx.amount),
        currency=str(tx.currency or "USD"),
        base_currency=str(tx.base_currency or "USD"),
        target_currency=str(tx.target_currency or tx.currency or "USD"),
        converted_amount=float(tx.converted_amount or tx.amount),
        exchange_rate=float(tx.exchange_rate or 1.0),
        payment_method=str(tx.payment_method),
        status=str(tx.status),
        refunded_amount=float(tx.refunded_amount or 0.0),
        remaining_refundable_balance=rem_bal,
        refunds=refund_summaries,
        created_at=tx.created_at.isoformat()
        if tx.created_at
        else get_utc_now().isoformat(),
    )


@router.get("/rates", response_model=List[ExchangeRateResponse])
def get_exchange_rates(
    base_currency: str = Query("USD", min_length=3, max_length=3),
    target_currency: Optional[str] = Query(None, min_length=3, max_length=3),
    db: Session = Depends(get_db),
):
    base_currency = base_currency.upper()
    if base_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported base currency: {base_currency}",
        )

    if target_currency:
        target_currency = target_currency.upper()
        if target_currency not in SUPPORTED_CURRENCIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported target currency: {target_currency}",
            )
        rate = CurrencyService.get_rate(base_currency, target_currency, db)
        return [
            ExchangeRateResponse(
                base_currency=base_currency,
                target_currency=target_currency,
                rate=float(rate),
                timestamp=get_utc_now().isoformat(),
            )
        ]

    rates = CurrencyService.get_all_rates(base_currency, db)
    return [
        ExchangeRateResponse(
            base_currency=r["base_currency"],
            target_currency=r["target_currency"],
            rate=float(r["rate"]),
            timestamp=r["timestamp"],
        )
        for r in rates
    ]
