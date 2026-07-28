import uuid
from datetime import datetime, date, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.mortgage import (
    User,
    MortgageAccount,
    FundingAccount,
    MortgagePayment,
    PaymentAuditLog,
)
from server.schemas.mortgage import (
    MortgageDetailsResponse,
    FundingAccountResponse,
    AccountValidationRequest,
    AccountValidationResponse,
    PaymentSubmissionRequest,
    PaymentSubmissionResponse,
    ScheduledPaymentResponse,
    ReceiptResponse,
)
from server.routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/mortgage", tags=["Mortgage"])


@router.get("/details", response_model=MortgageDetailsResponse)
def get_mortgage_details(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    mortgage = (
        db.query(MortgageAccount)
        .filter(MortgageAccount.customer_id == current_user.id)
        .first()
    )
    if not mortgage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mortgage account not found for this user",
        )
    return {
        "currentBalance": float(mortgage.current_balance),
        "escrowBalance": float(mortgage.escrow_balance),
        "interestRate": float(mortgage.interest_rate),
        "loanNumber": mortgage.loan_number,
        "minimumPaymentAmount": float(mortgage.minimum_payment_amount),
        "nextPaymentDueDate": mortgage.next_payment_due_date,
    }


@router.get("/accounts", response_model=List[FundingAccountResponse])
def get_funding_accounts(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    accounts = (
        db.query(FundingAccount)
        .filter(FundingAccount.customer_id == current_user.id)
        .all()
    )
    return [
        {
            "accountId": acc.account_id,
            "accountName": acc.account_name,
            "accountType": acc.account_type,
            "balance": float(acc.balance),
        }
        for acc in accounts
    ]


@router.post("/accounts/{accountId}/validate", response_model=AccountValidationResponse)
def validate_account_balance(
    accountId: str,
    validation_data: AccountValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Simulate Fiserv timeout for specific test account
    if accountId == "timeout-account":
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Fiserv balance inquiry timed out",
        )

    account = (
        db.query(FundingAccount)
        .filter(
            FundingAccount.customer_id == current_user.id,
            FundingAccount.account_id == accountId,
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unauthorized funding account",
        )

    payment_amount = validation_data.paymentAmount
    if payment_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero",
        )

    sufficient = float(account.balance) >= payment_amount
    return {"availableBalance": float(account.balance), "sufficientFunds": sufficient}


@router.post("/payments", response_model=PaymentSubmissionResponse)
def submit_payment(
    payment_data: PaymentSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Simulate Fiserv timeout for specific test account
    if payment_data.fromAccountId == "timeout-account":
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Fiserv balance inquiry timed out",
        )

    # Simulate Cenlar rejection for specific test loan
    if payment_data.loanNumber == "reject-loan":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cenlar mortgage servicer rejected the payment instruction",
        )

    # 1. Validate funding account ownership and status
    account = (
        db.query(FundingAccount)
        .filter(
            FundingAccount.customer_id == current_user.id,
            FundingAccount.account_id == payment_data.fromAccountId,
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unauthorized funding account",
        )

    # 2. Validate mortgage account
    mortgage = (
        db.query(MortgageAccount)
        .filter(
            MortgageAccount.customer_id == current_user.id,
            MortgageAccount.loan_number == payment_data.loanNumber,
        )
        .first()
    )

    if not mortgage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unauthorized mortgage loan number",
        )

    # 3. Validate payment amount rules
    amount = payment_data.amount
    if amount < float(mortgage.minimum_payment_amount):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount must be at least the minimum payment due (${mortgage.minimum_payment_amount})",
        )

    if amount > float(mortgage.current_balance):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount cannot exceed the outstanding balance (${mortgage.current_balance})",
        )

    # 4. Real-time Fiserv balance check
    if account.account_id == "timeout-account":
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Fiserv balance inquiry timed out",
        )

    if float(account.balance) < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient funds in the selected account",
        )

    # 5. Duplicate payment warning check (same account, same amount, same day)
    today = date.today()
    duplicate = (
        db.query(MortgagePayment)
        .filter(
            MortgagePayment.customer_id == current_user.id,
            MortgagePayment.from_account_id == payment_data.fromAccountId,
            MortgagePayment.amount == amount,
            MortgagePayment.payment_date == today,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate payment warning: A payment of this amount from this account has already been submitted today.",
        )

    # 6. Simulate Cenlar rejection for specific test loan
    if payment_data.loanNumber == "reject-loan":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cenlar mortgage servicer rejected the payment instruction",
        )

    # 7. Determine processing status based on cut-off time (5:00 PM ET)
    # Let's assume Eastern Time is UTC-5 (or UTC-4 during DST).
    # We can check the current UTC hour. 5:00 PM ET is 21:00 or 22:00 UTC.
    # Let's use 21:00 UTC as the cut-off.
    now_utc = datetime.now(timezone.utc)
    is_after_cutoff = now_utc.hour >= 21

    # If payment date is in the future, it is SCHEDULED.
    # If payment date is today but after cut-off, it is SCHEDULED for next business day.
    # Otherwise, it is PROCESSED same day.
    payment_date_obj = datetime.strptime(payment_data.date, "%Y-%m-%d").date()

    if payment_date_obj > today:
        payment_status = "SCHEDULED"
    elif payment_date_obj == today and is_after_cutoff:
        payment_status = "SCHEDULED"
        # Adjust payment date to next business day (for display/scheduling)
        # but let's keep the user's requested date or update it.
    else:
        payment_status = "PROCESSED"

    # 8. Generate transaction IDs
    fiserv_tx_id = f"FT-{uuid.uuid4().hex[:12].upper()}"
    cenlar_conf_id = f"CEN-{uuid.uuid4().hex[:12].upper()}"

    # 9. Create payment record
    new_payment = MortgagePayment(
        customer_id=current_user.id,
        loan_number=payment_data.loanNumber,
        from_account_id=payment_data.fromAccountId,
        amount=amount,
        currency="USD",
        payment_date=payment_date_obj,
        status=payment_status,
        fiserv_transaction_id=fiserv_tx_id,
        cenlar_confirmation_id=cenlar_conf_id,
    )

    db.add(new_payment)

    try:
        db.commit()
        db.refresh(new_payment)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}",
        )

    # 10. Debit funding account and update mortgage balance if PROCESSED
    if payment_status == "PROCESSED":
        account.balance = float(account.balance) - amount
        mortgage.current_balance = float(mortgage.current_balance) - amount
        try:
            db.commit()
        except Exception:
            db.rollback()
            # In a real system, we would reverse the transaction.
            # For the mock, we just log the error.

    # 11. Create audit logs
    audit_logs = [
        PaymentAuditLog(
            payment_id=new_payment.id,
            action="BALANCE_CHECK",
            details={"status": "SUCCESS", "available_balance": float(account.balance)},
        ),
        PaymentAuditLog(
            payment_id=new_payment.id,
            action="FUNDS_TRANSFER_INITIATED",
            details={"amount": amount, "from_account": account.account_id},
        ),
        PaymentAuditLog(
            payment_id=new_payment.id,
            action="CENLAR_SUBMISSION_SUCCESS",
            details={"confirmation_id": cenlar_conf_id},
        ),
    ]
    for log in audit_logs:
        db.add(log)

    try:
        db.commit()
    except Exception:
        db.rollback()

    return {
        "cenlarConfirmationId": cenlar_conf_id,
        "status": payment_status,
        "timestamp": now_utc.isoformat(),
        "transactionId": fiserv_tx_id,
    }


@router.get("/payments/scheduled", response_model=List[ScheduledPaymentResponse])
def get_scheduled_payments(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    payments = (
        db.query(MortgagePayment)
        .filter(
            MortgagePayment.customer_id == current_user.id,
            MortgagePayment.status == "SCHEDULED",
        )
        .all()
    )
    return [
        {
            "amount": float(p.amount),
            "paymentDate": p.payment_date.strftime("%Y-%m-%d"),
            "paymentId": p.id,
            "status": p.status,
        }
        for p in payments
    ]


@router.get("/payments/{transactionId}/receipt", response_model=ReceiptResponse)
def get_payment_receipt(
    transactionId: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = (
        db.query(MortgagePayment)
        .filter(
            MortgagePayment.customer_id == current_user.id,
            MortgagePayment.fiserv_transaction_id == transactionId,
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
        )

    return {
        "amount": float(payment.amount),
        "date": payment.payment_date.strftime("%Y-%m-%d"),
        "receiptId": f"REC-{payment.id[:8].upper()}",
        "status": payment.status,
        "transactionId": payment.fiserv_transaction_id,
    }
