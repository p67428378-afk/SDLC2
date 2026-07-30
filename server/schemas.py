from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict
from datetime import date


class UserLogin(BaseModel):
    username: EmailStr
    password: str


class LoginResponse(BaseModel):
    message: str
    mfa_token: str


class MFAVerify(BaseModel):
    mfa_token: str
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class CustomerProfile(BaseModel):
    cif: str
    first_name: str
    last_name: str
    email: str


class ProfilePreferences(BaseModel):
    email_notif: bool
    marketing: bool
    paperless: bool
    sms_notif: bool


class UserProfileResponse(BaseModel):
    cif: str
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    relationship_manager: str
    preferences: ProfilePreferences


class UserProfileUpdateRequest(BaseModel):
    address: str
    email: str
    phone: str
    preferences: ProfilePreferences


class ProfileChangeLogResponse(BaseModel):
    id: int
    user_id: str
    changed_fields_before: Dict
    changed_fields_after: Dict
    status: str
    failure_reason: Optional[str] = None
    compensation_applied: bool
    compensation_details: Optional[Dict] = None
    timestamp: str


class DepositAccount(BaseModel):
    id: str
    name: str
    type: str
    account_number: str
    balance: float
    interest_rate: float
    status: str


class LoanAccount(BaseModel):
    id: str
    name: str
    type: str
    account_number: str
    balance: float
    interest_rate: float
    status: str


class MortgageAccount(BaseModel):
    id: str
    name: str
    account_number: str
    principal_balance: float
    original_amount: float
    interest_rate: float
    term_months: int
    maturity_date: str
    escrow_balance: float
    next_payment_amount: float
    next_payment_due: str
    status: str


class DashboardAccounts(BaseModel):
    deposits: List[DepositAccount]
    loans: List[LoanAccount]
    mortgages: List[MortgageAccount]


class DashboardResponse(BaseModel):
    customer_profile: CustomerProfile
    accounts: DashboardAccounts


class SummaryResponse(BaseModel):
    total_deposits: float
    total_loans: float
    total_mortgages: float
    net_worth: float


# --- NEW SCHEMAS FOR PAYMENTS ---


class MortgagePaymentRequest(BaseModel):
    source_account_id: str
    mortgage_account_id: str
    amount: float = Field(..., gt=0)


class MortgagePaymentResponse(BaseModel):
    amount: float
    confirmation_number: str
    mortgage_account_id: str
    payment_date: str
    source_account_id: str
    updated_mortgage_balance: float
    updated_source_balance: float


class PaymentHistoryResponse(BaseModel):
    id: str
    user_id: str
    source_account_id: str
    mortgage_account_id: str
    amount: float
    status: str
    confirmation_number: str
    created_at: str


class ScheduledPaymentRequest(BaseModel):
    source_account_id: str
    mortgage_account_id: str
    amount: float = Field(..., gt=0)
    scheduled_date: date


class ScheduledPaymentResponse(BaseModel):
    id: str
    user_id: str
    source_account_id: str
    mortgage_account_id: str
    amount: float
    scheduled_date: str
    status: str
    created_at: str


class CancelScheduledPaymentResponse(BaseModel):
    message: str
    success: bool
