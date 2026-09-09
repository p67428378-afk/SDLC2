from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class CartItem(BaseModel):
    name: str
    quantity: int = 1
    unit_price: float


class CheckoutSessionRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in base currency")
    currency: str = Field(
        "USD", description="Target currency ISO code (USD, EUR, GBP, JPY, CAD)"
    )
    customer_email: EmailStr = Field(
        "customer@example.com", description="Customer email address"
    )
    items: Optional[List[CartItem]] = Field(default_factory=list)


class CheckoutSessionResponse(BaseModel):
    session_id: str
    payment_intent_id: str
    client_secret: str
    base_amount: float
    base_currency: str
    target_amount: float
    target_currency: str
    exchange_rate: float


class DigitalWalletPaymentRequest(BaseModel):
    wallet_type: str = Field(..., description="Wallet type: apple_pay or google_pay")
    payment_token: str = Field(
        ..., min_length=1, description="Encrypted or raw wallet payment token"
    )
    currency: str = Field("USD", description="Target currency ISO code")
    amount: float = Field(..., gt=0, description="Payment amount")
    customer_email: Optional[EmailStr] = Field(
        "customer@example.com", description="Customer email"
    )


class DigitalWalletPaymentResponse(BaseModel):
    transaction_id: str
    payment_intent_id: str
    status: str
    amount: float
    currency: str
    wallet_type: str


class RefundRequest(BaseModel):
    transaction_id: str = Field(..., description="Transaction ID to refund")
    amount: float = Field(..., gt=0, description="Refund amount")
    reason: str = Field(..., min_length=1, description="Mandatory refund reason")
    memo: Optional[str] = Field(None, description="Optional internal memo")


class RefundSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: str
    refund_amount: float
    currency: str
    status: str
    reason: str
    created_at: Union[str, datetime]


class TransactionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_intent_id: str
    customer_email: str
    amount: float
    currency: str
    payment_method: str
    status: str
    created_at: Union[str, datetime]


class TransactionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_intent_id: str
    customer_email: str
    amount: float
    base_currency: str
    converted_amount: float
    target_currency: str
    exchange_rate: float
    payment_method: str
    status: str
    refunded_amount: float
    remaining_refundable_balance: float
    refunds: List[RefundSummary] = []
    created_at: Union[str, datetime]


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    transaction_id: Optional[str] = None
    event_type: str
    masked_payload: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: Union[str, datetime]


class ExchangeRateResponse(BaseModel):
    base_currency: str
    rates: Dict[str, float]
    timestamp: Union[str, datetime]
