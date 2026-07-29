from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from server.config import settings
from server.database import get_db, init_db, seed_data
from server.models import User
from server.schemas import (
    UserLogin,
    LoginResponse,
    MFAVerify,
    TokenResponse,
    DashboardResponse,
    SummaryResponse,
    UserProfileResponse,
)
from server.auth import (
    verify_password,
    create_mfa_token,
    create_access_token,
    verify_mfa_token,
    get_current_user,
)
from server.services.fiserv import FiservMockService
from server.services.cenlar import CenlarMockService
from server.services.aggregation import AggregationService

# Initialize mock services
fiserv_service = FiservMockService()
cenlar_service = CenlarMockService()
aggregation_service = AggregationService(fiserv_service, cenlar_service)

# Lifespan context manager or startup event
# Since we want to support both, let's use startup event or lifespan.
# Let's use the standard startup event or lifespan.
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and seed data
    init_db()
    db = next(get_db())
    try:
        seed_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Unified Banking & Mortgage Dashboard API", version="1.0.0", lifespan=lifespan
)

# CORS Middleware
ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Auth Routes
@app.post("/api/v1/auth/login", response_model=LoginResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # Create temporary MFA token
    mfa_token = create_mfa_token({"sub": user.username})
    return {"message": "MFA code required", "mfa_token": mfa_token}


@app.post("/api/v1/auth/verify-mfa", response_model=TokenResponse)
def verify_mfa(payload: MFAVerify):
    username = verify_mfa_token(payload.mfa_token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired MFA token",
        )

    # Accept static code 123456 for bypass
    if payload.code != "123456":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid MFA code"
        )

    access_token = create_access_token({"sub": username})
    return {"access_token": access_token, "token_type": "bearer"}


# Dashboard & Summary Routes
@app.get("/api/v1/dashboard", response_model=DashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user)):
    return aggregation_service.get_aggregated_dashboard(
        current_user.fiserv_cif, current_user.cenlar_customer_id
    )


@app.get("/api/v1/summary", response_model=SummaryResponse)
def get_summary(current_user: User = Depends(get_current_user)):
    return aggregation_service.get_relationship_summary(
        current_user.fiserv_cif, current_user.cenlar_customer_id
    )


@app.get("/api/v1/accounts/banking")
def get_banking_accounts(current_user: User = Depends(get_current_user)):
    if not current_user.fiserv_cif:
        return []
    return fiserv_service.get_accounts(current_user.fiserv_cif)


@app.get("/api/v1/accounts/mortgage")
def get_mortgage_accounts(current_user: User = Depends(get_current_user)):
    if not current_user.cenlar_customer_id:
        return []
    return cenlar_service.get_mortgages(current_user.cenlar_customer_id)


@app.get("/api/v1/accounts/{source}/{account_id}")
def get_account_detail(
    source: str, account_id: str, current_user: User = Depends(get_current_user)
):
    if source == "fiserv":
        if not current_user.fiserv_cif:
            raise HTTPException(status_code=404, detail="Account not found")
        details = fiserv_service.get_account_details(
            current_user.fiserv_cif, account_id
        )
    elif source == "cenlar":
        if not current_user.cenlar_customer_id:
            raise HTTPException(status_code=404, detail="Account not found")
        details = cenlar_service.get_mortgage_details(
            current_user.cenlar_customer_id, account_id
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid account source")

    if not details:
        raise HTTPException(status_code=404, detail="Account not found")
    return details


@app.get("/api/v1/profile", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    if not current_user.fiserv_cif:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = fiserv_service.get_customer_profile(current_user.fiserv_cif)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
