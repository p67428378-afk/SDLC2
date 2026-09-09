from datetime import datetime, timezone
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from server.config import settings


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8")
        )
    except Exception:
        return False


db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(target_engine=None):
    from server import models  # noqa: F401

    eng = target_engine or engine
    Base.metadata.create_all(bind=eng)


def seed_data(db):
    from server.models import User, ExchangeRateCache
    from sqlalchemy.exc import IntegrityError

    # Seed regular user
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        try:
            test_user = User(
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                role="customer",
                is_active=True,
                is_verified=True,
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        except IntegrityError:
            db.rollback()

    # Seed admin user
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        try:
            admin_user = User(
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                role="admin",
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        except IntegrityError:
            db.rollback()

    # Seed initial exchange rates
    default_rates = {
        "USD": 1.0,
        "EUR": 0.9250,
        "GBP": 0.7950,
        "JPY": 155.20,
        "CAD": 1.3650,
    }
    for curr, rate in default_rates.items():
        existing_rate = (
            db.query(ExchangeRateCache)
            .filter(
                ExchangeRateCache.base_currency == "USD",
                ExchangeRateCache.target_currency == curr,
            )
            .first()
        )
        if not existing_rate:
            try:
                cache_entry = ExchangeRateCache(
                    base_currency="USD",
                    target_currency=curr,
                    rate=rate,
                    expires_at=datetime.now(timezone.utc),
                )
                db.add(cache_entry)
                db.commit()
            except IntegrityError:
                db.rollback()
