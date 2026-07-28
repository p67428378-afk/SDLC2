from pydantic import BaseModel, field_validator
from typing import Optional


class AccountResponse(BaseModel):
    accountId: str
    accountName: str
    accountType: str
    balance: float


class PaymentValidateRequest(BaseModel):
    amount: float
    source_account_id: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v < 1.00 or v > 100000.00:
            raise ValueError("Payment amount must be between $1.00 and $100,000.00")
        return v


class PaymentValidateResponse(BaseModel):
    availableBalance: float
    sufficientFunds: bool


class PaymentCreateRequest(BaseModel):
    amount: float
    mortgage_account_id: str
    payment_type: str  # IMMEDIATE or SCHEDULED
    scheduled_date: Optional[str] = None  # ISO 8601 string
    source_account_id: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v < 1.00 or v > 100000.00:
            raise ValueError("Payment amount must be between $1.00 and $100,000.00")
        return v

    @field_validator("payment_type")
    @classmethod
    def validate_payment_type(cls, v):
        if v not in ["IMMEDIATE", "SCHEDULED"]:
            raise ValueError("payment_type must be IMMEDIATE or SCHEDULED")
        return v


class PaymentCreateResponse(BaseModel):
    cenlarConfirmationId: Optional[str] = None
    paymentId: str
    status: str
    timestamp: str
    transactionId: Optional[str] = None


class PaymentHistoryResponse(BaseModel):
    amount: float
    created_at: str
    mortgage_account_id: str
    paymentId: str
    payment_type: str
    source_account_id: str
    status: str


class ScheduledPaymentResponse(BaseModel):
    amount: float
    paymentDate: str
    paymentId: str
    status: str


class PaymentDetailResponse(BaseModel):
    amount: float
    cenlar_transaction_id: Optional[str] = None
    created_at: str
    fiserv_transaction_id: Optional[str] = None
    mortgage_account_id: str
    paymentId: str
    payment_type: str
    source_account_id: str
    status: str


class PaymentReceiptResponse(BaseModel):
    amount: float
    mortgage_account_id: str
    paymentId: str
    receiptId: str
    source_account_id: str
    status: str
    timestamp: str
    transaction_reference: str


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
