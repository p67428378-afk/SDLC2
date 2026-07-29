from pydantic import BaseModel, EmailStr
from typing import List


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


class UserProfileResponse(BaseModel):
    cif: str
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    relationship_manager: str


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
