from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class CartItem(BaseModel):
    id: Optional[str] = None
    name: str
    price: float
    quantity: int = 1


class CheckoutSessionRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Cart total amount")
    currency: str = Field(
        "USD", min_length=3, max_length=3, description="ISO 4217 currency code"
    )
    customer_email: Optional[str] = None
    items: Optional[List[CartItem]] = None
    cardholder_name: Optional[str] = None
    card_number: Optional[str] = None
    exp_month: Optional[int] = None
    exp_year: Optional[int] = None
    cvv: Optional[str] = None


class CheckoutSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    payment_intent_id: Optional[str] = None
    client_secret: Optional[str] = None
    base_amount: float
    base_currency: str
    target_amount: float
    target_currency: str
    exchange_rate: float


class DigitalWalletPaymentRequest(BaseModel):
    wallet_type: str = Field(..., description="'apple_pay' or 'google_pay'")
    payment_token: str = Field(
        ..., min_length=1, description="Raw payment token from Apple/Google SDK"
    )
    amount: float = Field(..., gt=0)
    currency: str = Field("USD", min_length=3, max_length=3)
    customer_email: Optional[str] = None


class RefundRequest(BaseModel):
    transaction_id: str = Field(..., description="Target transaction ID")
    amount: float = Field(..., gt=0, description="Amount to refund")
    reason: str = Field(..., min_length=1, description="Mandatory reason for refund")
    memo: Optional[str] = None
    refund_type: Optional[str] = "full"


class RefundSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: str
    refund_amount: float
    currency: str
    reason: str
    status: str
    created_at: str


class TransactionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_intent_id: Optional[str] = None
    customer_email: Optional[str] = None
    amount: float
    currency: str
    payment_method: str
    status: str
    created_at: str


class TransactionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_intent_id: Optional[str] = None
    customer_email: Optional[str] = None
    amount: float
    currency: str = "USD"
    base_currency: str = "USD"
    target_currency: str = "USD"
    converted_amount: float
    exchange_rate: float
    payment_method: str
    status: str
    refunded_amount: float
    remaining_refundable_balance: float
    refunds: List[RefundSummary] = []
    created_at: str


class ExchangeRateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    base_currency: str
    target_currency: str
    rate: float
    timestamp: str


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: Optional[str] = None
    event_type: str
    action: Optional[str] = None
    ip_address: Optional[str] = None
    user_id: Optional[str] = None
    status_code: Optional[int] = 200
    signature_valid: Optional[bool] = True
    masked_payload: Optional[Dict[str, Any]] = None
    created_at: str
