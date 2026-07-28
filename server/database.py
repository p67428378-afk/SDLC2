from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import bcrypt
from server.config import settings

# Create engine
# For SQLite, we need connect_args={"check_same_thread": False}
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models here to register them on Base.metadata
    Base.metadata.create_all(bind=engine)


def seed_data(db):
    from server.models.payment import User, MortgageAccount, FundingAccount
    from sqlalchemy.exc import IntegrityError
    import uuid

    # Seed User
    test_email = "test@example.com"
    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            username="testuser",
            email=test_email,
            hashed_password=get_password_hash("testpassword"),
            is_active=True,
            is_verified=True,
            email_verified=True,
            disabled=False,
            is_locked=False,
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter(User.email == test_email).first()

    # Seed Mortgage Account
    mortgage_id = "MTG-88492"
    mortgage = (
        db.query(MortgageAccount).filter(MortgageAccount.id == mortgage_id).first()
    )
    if not mortgage:
        mortgage = MortgageAccount(
            id=mortgage_id,
            customer_id=user.id,
            loan_number="MTG-88492",
            outstanding_balance=250000.00,
            next_payment_due_date="2026-08-01",
            minimum_payment_due=1500.00,
            interest_rate=4.25,
            escrow_balance=3450.00,
            loan_term="30 Years",
            maturity_date="2056-07-01",
        )
        db.add(mortgage)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()

    # Seed Funding Accounts (DDA and Savings)
    dda_id = "dda-456"
    dda = db.query(FundingAccount).filter(FundingAccount.id == dda_id).first()
    if not dda:
        dda = FundingAccount(
            id=dda_id,
            customer_id=user.id,
            account_name="Primary Checking",
            account_type="DDA",
            available_balance=5430.50,
            masked_account_number="•••• 4567",
        )
        db.add(dda)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()

    savings_id = "sav-789"
    savings = db.query(FundingAccount).filter(FundingAccount.id == savings_id).first()
    if not savings:
        savings = FundingAccount(
            id=savings_id,
            customer_id=user.id,
            account_name="High-Yield Savings",
            account_type="Savings",
            available_balance=12500.00,
            masked_account_number="•••• 7890",
        )
        db.add(savings)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
