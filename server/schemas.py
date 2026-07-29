from pydantic import BaseModel
from typing import List, Dict, Any


class UserBase(BaseModel):
    username: str


class UserResponse(UserBase):
    id: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    message: str
    mfa_token: str


class MfaVerifyRequest(BaseModel):
    code: str
    mfa_token: str


class MfaVerifyResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class AccountResponse(BaseModel):
    id: str
    accountNumber: str
    name: str
    institution: str
    type: str
    balance: float
    status: str


class DashboardResponse(BaseModel):
    accounts: List[AccountResponse]
    netWorth: float
    totalDeposits: float
    totalMortgage: float


class AccountDetailResponse(BaseModel):
    id: str
    accountNumber: str
    name: str
    institution: str
    type: str
    balance: float
    status: str
    details: Dict[str, Any]


class FiservAccount(BaseModel):
    id: str
    accountNumber: str
    balance: float
    type: str


class FiservAccountsResponse(BaseModel):
    accounts: List[FiservAccount]
    cifId: str


class CenlarMortgage(BaseModel):
    id: str
    accountNumber: str
    balance: float
    escrowBalance: float


class CenlarMortgagesResponse(BaseModel):
    customerId: str
    mortgages: List[CenlarMortgage]


class MockConfigRequest(BaseModel):
    scenario: str


class MockConfigResponse(BaseModel):
    scenario: str
    status: str
