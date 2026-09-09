from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from passlib.context import CryptContext
from server.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args, pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(target_engine=None):
    eng = target_engine or engine
    Base.metadata.create_all(bind=eng)


def seed_data(db: Session):
    from server.models.user import User
    from server.models.exchange_rate_cache import ExchangeRateCache
    from datetime import datetime, timezone, timedelta

    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    # Seed regular test user
    try:
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                full_name="Test User",
                role="user",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
    except Exception:
        db.rollback()

    # Seed admin user
    try:
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                email="admin@example.com",
                hashed_password=get_password_hash("adminpassword"),
                full_name="Admin User",
                role="admin",
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
    except Exception:
        db.rollback()

    # Seed initial exchange rates
    try:
        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=15)
        rates = [
            ("USD", "EUR", 0.925000),
            ("USD", "GBP", 0.790000),
            ("USD", "CAD", 1.360000),
            ("USD", "AUD", 1.520000),
            ("USD", "JPY", 155.500000),
            ("EUR", "USD", 1.081081),
            ("GBP", "USD", 1.265822),
            ("CAD", "USD", 0.735294),
        ]
        for base_curr, target_curr, rate in rates:
            cached = (
                db.query(ExchangeRateCache)
                .filter(
                    ExchangeRateCache.base_currency == base_curr,
                    ExchangeRateCache.target_currency == target_curr,
                )
                .first()
            )
            if not cached:
                cache_entry = ExchangeRateCache(
                    base_currency=base_curr,
                    target_currency=target_curr,
                    rate=rate,
                    expires_at=expires,
                )
                db.add(cache_entry)
        db.commit()
    except Exception:
        db.rollback()
