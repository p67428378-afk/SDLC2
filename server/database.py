import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import IntegrityError
from server.config import settings

DATABASE_URL = settings.DATABASE_URL

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    poolclass=StaticPool if DATABASE_URL.startswith("sqlite") else None,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


def seed_data(db):
    from server.models.mortgage import User, MortgageAccount, FundingAccount

    # Seed Users
    users_to_seed = [
        {"email": "test@example.com", "password": "testpassword", "role": "user"},
        {"email": "admin@example.com", "password": "adminpassword", "role": "admin"},
    ]

    seeded_users = {}
    for u in users_to_seed:
        existing_user = db.query(User).filter(User.email == u["email"]).first()
        if not existing_user:
            hashed_password = hash_password(u["password"])
            new_user = User(
                email=u["email"],
                hashed_password=hashed_password,
                role=u["role"],
                is_active=True,
                is_verified=True,
                email_verified=True,
                disabled=False,
            )
            db.add(new_user)
            try:
                db.commit()
                db.refresh(new_user)
                seeded_users[u["email"]] = new_user
            except IntegrityError:
                db.rollback()
                seeded_users[u["email"]] = (
                    db.query(User).filter(User.email == u["email"]).first()
                )
        else:
            seeded_users[u["email"]] = existing_user

    # Seed Mortgage Account for test@example.com
    test_user = seeded_users.get("test@example.com")
    if test_user:
        existing_mortgage = (
            db.query(MortgageAccount)
            .filter(MortgageAccount.customer_id == test_user.id)
            .first()
        )
        if not existing_mortgage:
            new_mortgage = MortgageAccount(
                customer_id=test_user.id,
                loan_number="30049182",
                current_balance=245850.00,
                minimum_payment_amount=1250.00,
                next_payment_due_date="2026-06-01",
                interest_rate=4.25,
                escrow_balance=4500.00,
            )
            db.add(new_mortgage)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()

        # Seed Funding Accounts (DDA and Savings)
        funding_accounts = [
            {
                "account_id": "dda-123",
                "account_name": "Premium Checking",
                "account_type": "DDA",
                "balance": 5000.00,
            },
            {
                "account_id": "sav-456",
                "account_name": "High-Yield Savings",
                "account_type": "Savings",
                "balance": 15000.00,
            },
            {
                "account_id": "dda-low",
                "account_name": "Basic Checking (Low Balance)",
                "account_type": "DDA",
                "balance": 100.00,
            },
        ]
        for fa in funding_accounts:
            existing_fa = (
                db.query(FundingAccount)
                .filter(
                    FundingAccount.customer_id == test_user.id,
                    FundingAccount.account_id == fa["account_id"],
                )
                .first()
            )
            if not existing_fa:
                new_fa = FundingAccount(
                    customer_id=test_user.id,
                    account_id=fa["account_id"],
                    account_name=fa["account_name"],
                    account_type=fa["account_type"],
                    balance=fa["balance"],
                )
                db.add(new_fa)
                try:
                    db.commit()
                except IntegrityError:
                    db.rollback()
