from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from server.database import get_db
from server.models.payment import (
    User,
    MortgageAccount,
    FundingAccount,
    PaymentTransaction,
    ScheduledPayment,
    AuditLog,
)
from server.schemas.payment import (
    MortgageDetailsResponse,
    AccountResponse,
    PaymentValidationRequest,
    PaymentValidationResponse,
    PaymentSubmissionRequest,
    PaymentSubmissionResponse,
    PaymentDetailsResponse,
    ScheduledPaymentRequest,
    ScheduledPaymentUpdateRequest,
    ScheduledPaymentResponse,
    ScheduledPaymentDeleteResponse,
    PaymentHistoryResponse,
)
from server.routers.auth import get_current_user
from server.adapters.fiserv_adapter import (
    FiservAdapter,
    FiservTimeoutException,
    FiservValidationException,
)
from server.adapters.cenlar_adapter import (
    CenlarAdapter,
    CenlarTimeoutException,
    CenlarValidationException,
)

router = APIRouter(prefix="/api/v1", tags=["payments"])


@router.get("/mortgages/{id}", response_model=MortgageDetailsResponse)
def get_mortgage_details(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mortgage = (
        db.query(MortgageAccount)
        .filter(
            (MortgageAccount.id == id) | (MortgageAccount.loan_number == id),
            MortgageAccount.customer_id == current_user.id,
        )
        .first()
    )
    if not mortgage:
        raise HTTPException(status_code=404, detail="Mortgage not found")
    return {
        "id": mortgage.id,
        "loanNumber": mortgage.loan_number,
        "outstandingBalance": float(mortgage.outstanding_balance),
        "nextPaymentDueDate": mortgage.next_payment_due_date,
        "minimumPaymentDue": float(mortgage.minimum_payment_due),
        "interestRate": float(mortgage.interest_rate),
        "escrowBalance": float(mortgage.escrow_balance),
        "loanTerm": mortgage.loan_term,
        "maturityDate": mortgage.maturity_date,
    }


@router.get("/accounts", response_model=List[AccountResponse])
def list_source_accounts(
    eligible: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(FundingAccount).filter(
        FundingAccount.customer_id == current_user.id
    )
    accounts = query.all()

    # If eligible is True, we can filter or just return all since both DDA and Savings are eligible
    return [
        {
            "id": acc.id,
            "accountName": acc.account_name,
            "accountType": acc.account_type,
            "availableBalance": float(acc.available_balance),
            "maskedAccountNumber": acc.masked_account_number,
        }
        for acc in accounts
    ]


@router.post("/payments/validate", response_model=PaymentValidationResponse)
def validate_payment(
    req: PaymentValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate source account
    account = (
        db.query(FundingAccount)
        .filter(
            FundingAccount.id == req.sourceAccountId,
            FundingAccount.customer_id == current_user.id,
        )
        .first()
    )
    if not account:
        raise HTTPException(status_code=400, detail="Invalid source account")

    # Real-time validation via Fiserv
    try:
        is_valid = FiservAdapter.validate_account(account.id, current_user.id)
        if not is_valid:
            raise HTTPException(
                status_code=400, detail="Source account is inactive or ineligible"
            )

        balance = FiservAdapter.get_balance(account.id)
    except FiservTimeoutException as e:
        raise HTTPException(status_code=400, detail=str(e))

    if balance < req.amount:
        raise HTTPException(
            status_code=400, detail="Insufficient funds in source account"
        )

    # Check for duplicate payments (same amount and mortgageId within last 24 hours)
    one_day_ago = datetime.utcnow() - timedelta(days=1)
    duplicate = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.mortgage_account_id == req.mortgageId,
            PaymentTransaction.amount == req.amount,
            PaymentTransaction.created_at >= one_day_ago,
            PaymentTransaction.status == "COMPLETED",
        )
        .first()
    )

    is_duplicate = duplicate is not None
    warning_message = (
        "Warning: A payment of the same amount was recently submitted for this mortgage."
        if is_duplicate
        else None
    )

    return {
        "availableBalance": balance,
        "isDuplicate": is_duplicate,
        "isValid": True,
        "warningMessage": warning_message,
    }


@router.post("/payments", response_model=PaymentSubmissionResponse)
def submit_payment(
    req: PaymentSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check idempotency
    existing_tx = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.idempotency_key == req.idempotencyKey)
        .first()
    )
    if existing_tx:
        mortgage = (
            db.query(MortgageAccount)
            .filter(MortgageAccount.id == req.mortgageId)
            .first()
        )
        return {
            "confirmationNumber": existing_tx.cenlar_confirmation_id or "",
            "status": existing_tx.status,
            "timestamp": existing_tx.created_at.isoformat(),
            "transactionId": existing_tx.id,
            "updatedMortgageBalance": float(mortgage.outstanding_balance)
            if mortgage
            else 0.0,
        }

    # Validate source account and mortgage
    account = (
        db.query(FundingAccount)
        .filter(
            FundingAccount.id == req.sourceAccountId,
            FundingAccount.customer_id == current_user.id,
        )
        .first()
    )
    if not account:
        raise HTTPException(status_code=400, detail="Invalid source account")

    mortgage = (
        db.query(MortgageAccount)
        .filter(
            MortgageAccount.id == req.mortgageId,
            MortgageAccount.customer_id == current_user.id,
        )
        .first()
    )
    if not mortgage:
        raise HTTPException(status_code=400, detail="Invalid mortgage account")

    # Real-time balance check
    try:
        balance = FiservAdapter.get_balance(account.id)
    except FiservTimeoutException as e:
        raise HTTPException(status_code=400, detail=str(e))

    if balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    # Initiate Saga
    tx_id = str(uuid.uuid4())
    tx = PaymentTransaction(
        id=tx_id,
        idempotency_key=req.idempotencyKey,
        customer_id=current_user.id,
        mortgage_account_id=mortgage.id,
        source_account_id=account.id,
        amount=req.amount,
        status="PENDING",
    )
    db.add(tx)
    db.commit()

    # Log SAGA_START
    audit = AuditLog(
        payment_transaction_id=tx_id,
        event_type="SAGA_START",
        event_details={
            "amount": req.amount,
            "source_account": account.id,
            "mortgage_account": mortgage.id,
        },
    )
    db.add(audit)
    db.commit()

    # Step 1: Debit Funds (Fiserv)
    try:
        fiserv_tx_id = FiservAdapter.transfer_funds(
            req.idempotencyKey, account.id, req.amount
        )
        tx.status = "DEBITED"
        tx.fiserv_transaction_id = fiserv_tx_id
        db.commit()

        # Log FISERV_DEBIT_SUCCESS
        db.add(
            AuditLog(
                payment_transaction_id=tx_id,
                event_type="FISERV_DEBIT_SUCCESS",
                event_details={"fiserv_transaction_id": fiserv_tx_id},
            )
        )
        db.commit()
    except (FiservTimeoutException, FiservValidationException) as e:
        tx.status = "FAILED"
        db.commit()

        # Log FISERV_DEBIT_FAILURE
        db.add(
            AuditLog(
                payment_transaction_id=tx_id,
                event_type="FISERV_DEBIT_FAILURE",
                event_details={"error": str(e)},
            )
        )
        db.commit()
        raise HTTPException(status_code=500, detail=f"Fiserv debit failed: {str(e)}")

    # Step 2: Post Payment (Cenlar)
    try:
        cenlar_confirm_id = CenlarAdapter.post_payment(
            mortgage.id, req.amount, fiserv_tx_id, req.idempotencyKey
        )
        tx.status = "COMPLETED"
        tx.cenlar_confirmation_id = cenlar_confirm_id

        # Update local mortgage balance
        mortgage.outstanding_balance = float(mortgage.outstanding_balance) - req.amount
        db.commit()

        # Log CENLAR_POST_SUCCESS
        db.add(
            AuditLog(
                payment_transaction_id=tx_id,
                event_type="CENLAR_POST_SUCCESS",
                event_details={"cenlar_confirmation_id": cenlar_confirm_id},
            )
        )
        db.commit()

        # Update payment history in Cenlar
        CenlarAdapter.update_payment_history(mortgage.id, cenlar_confirm_id, req.amount)

        # Post transaction to Fiserv ledger
        FiservAdapter.post_transaction(account.id, fiserv_tx_id, req.amount)

    except (CenlarTimeoutException, CenlarValidationException) as e:
        # Saga Reversal
        tx.status = "REVERSAL_PENDING"
        db.commit()

        db.add(
            AuditLog(
                payment_transaction_id=tx_id,
                event_type="CENLAR_POST_FAILURE",
                event_details={"error": str(e)},
            )
        )
        db.commit()

        # Compensating Transaction: Reverse Debit (Fiserv)
        try:
            reversal_id = FiservAdapter.reverse_transfer(
                fiserv_tx_id, "Cenlar instruction failed"
            )
            tx.status = "REVERSED"
            db.commit()

            db.add(
                AuditLog(
                    payment_transaction_id=tx_id,
                    event_type="FISERV_REVERSAL_SUCCESS",
                    event_details={"reversal_id": reversal_id},
                )
            )
            db.commit()
        except Exception as rev_err:
            tx.status = "REVERSAL_FAILED"
            db.commit()

            db.add(
                AuditLog(
                    payment_transaction_id=tx_id,
                    event_type="FISERV_REVERSAL_FAILURE",
                    event_details={"error": str(rev_err)},
                )
            )
            db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Cenlar payment failed. Saga triggered reversal. Status: {tx.status}",
        )

    return {
        "confirmationNumber": cenlar_confirm_id,
        "status": tx.status,
        "timestamp": tx.created_at.isoformat(),
        "transactionId": tx.id,
        "updatedMortgageBalance": float(mortgage.outstanding_balance),
    }


@router.get("/payments/{id}", response_model=PaymentDetailsResponse)
def get_payment_status(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.id == id,
            PaymentTransaction.customer_id == current_user.id,
        )
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Payment not found")

    mortgage = (
        db.query(MortgageAccount)
        .filter(MortgageAccount.id == tx.mortgage_account_id)
        .first()
    )

    return {
        "amount": float(tx.amount),
        "confirmationNumber": tx.cenlar_confirmation_id or "",
        "mortgageId": tx.mortgage_account_id,
        "paymentDate": tx.created_at.strftime("%Y-%m-%d"),
        "sourceAccountId": tx.source_account_id,
        "status": tx.status,
        "timestamp": tx.created_at.isoformat(),
        "transactionId": tx.id,
        "updatedMortgageBalance": float(mortgage.outstanding_balance)
        if mortgage
        else 0.0,
    }


@router.get("/scheduled-payments", response_model=List[ScheduledPaymentResponse])
def list_scheduled_payments(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    payments = (
        db.query(ScheduledPayment)
        .filter(ScheduledPayment.customer_id == current_user.id)
        .all()
    )
    return [
        {
            "id": p.id,
            "amount": float(p.amount),
            "endDate": p.end_date,
            "frequency": p.frequency,
            "isActive": p.is_active,
            "mortgageId": p.mortgage_account_id,
            "sourceAccountId": p.source_account_id,
            "startDate": p.start_date,
        }
        for p in payments
    ]


@router.post("/scheduled-payments", response_model=ScheduledPaymentResponse)
def create_scheduled_payment(
    req: ScheduledPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate source account and mortgage
    account = (
        db.query(FundingAccount)
        .filter(
            FundingAccount.id == req.sourceAccountId,
            FundingAccount.customer_id == current_user.id,
        )
        .first()
    )
    if not account:
        raise HTTPException(status_code=400, detail="Invalid source account")

    mortgage = (
        db.query(MortgageAccount)
        .filter(
            MortgageAccount.id == req.mortgageId,
            MortgageAccount.customer_id == current_user.id,
        )
        .first()
    )
    if not mortgage:
        raise HTTPException(status_code=400, detail="Invalid mortgage account")

    p_id = str(uuid.uuid4())
    p = ScheduledPayment(
        id=p_id,
        customer_id=current_user.id,
        mortgage_account_id=req.mortgageId,
        source_account_id=req.sourceAccountId,
        amount=req.amount,
        frequency=req.frequency,
        start_date=req.startDate,
        end_date=req.endDate,
        is_active=True,
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    return {
        "id": p.id,
        "amount": float(p.amount),
        "endDate": p.end_date,
        "frequency": p.frequency,
        "isActive": p.is_active,
        "mortgageId": p.mortgage_account_id,
        "sourceAccountId": p.source_account_id,
        "startDate": p.start_date,
    }


@router.put("/scheduled-payments/{id}", response_model=ScheduledPaymentResponse)
def update_scheduled_payment(
    id: str,
    req: ScheduledPaymentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = (
        db.query(ScheduledPayment)
        .filter(
            ScheduledPayment.id == id, ScheduledPayment.customer_id == current_user.id
        )
        .first()
    )
    if not p:
        raise HTTPException(status_code=404, detail="Scheduled payment not found")

    p.amount = req.amount
    p.frequency = req.frequency
    p.start_date = req.startDate
    p.end_date = req.endDate
    p.is_active = req.isActive

    db.commit()
    db.refresh(p)

    return {
        "id": p.id,
        "amount": float(p.amount),
        "endDate": p.end_date,
        "frequency": p.frequency,
        "isActive": p.is_active,
        "mortgageId": p.mortgage_account_id,
        "sourceAccountId": p.source_account_id,
        "startDate": p.start_date,
    }


@router.delete(
    "/scheduled-payments/{id}", response_model=ScheduledPaymentDeleteResponse
)
def delete_scheduled_payment(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = (
        db.query(ScheduledPayment)
        .filter(
            ScheduledPayment.id == id, ScheduledPayment.customer_id == current_user.id
        )
        .first()
    )
    if not p:
        raise HTTPException(status_code=404, detail="Scheduled payment not found")

    db.delete(p)
    db.commit()

    return {"message": "Scheduled payment successfully canceled", "success": True}


@router.get("/mortgages/{id}/payments", response_model=List[PaymentHistoryResponse])
def get_payment_history(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mortgage = (
        db.query(MortgageAccount)
        .filter(
            (MortgageAccount.id == id) | (MortgageAccount.loan_number == id),
            MortgageAccount.customer_id == current_user.id,
        )
        .first()
    )
    if not mortgage:
        raise HTTPException(status_code=404, detail="Mortgage not found")

    # Fetch from Cenlar
    history = CenlarAdapter.get_payment_history(mortgage.id)
    return [
        {
            "amount": item["amount"],
            "confirmationNumber": item["confirmationNumber"],
            "date": item["date"],
            "description": item["description"],
            "status": item["status"],
        }
        for item in history
    ]
