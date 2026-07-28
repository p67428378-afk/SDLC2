import os
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from server.config import settings

# Use SQLite in-memory for testing if TESTING is True
if settings.TESTING or os.getenv("TESTING") == "true":
    DATABASE_URL = "sqlite:///:memory:"
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    DATABASE_URL = settings.DATABASE_URL
    if DATABASE_URL.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        engine = create_engine(DATABASE_URL, connect_args=connect_args)
    else:
        engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models here to register them on Base.metadata
    from server.models import Base as ModelBase

    ModelBase.metadata.create_all(bind=engine)


def seed_data(db):
    from server.models import User
    from sqlalchemy.exc import IntegrityError

    # Seed regular user
    regular_email = "test@example.com"
    regular_user = db.query(User).filter(User.email == regular_email).first()
    if not regular_user:
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw("testpassword".encode("utf-8"), salt).decode(
            "utf-8"
        )
        new_user = User(
            email=regular_email,
            hashed_password=hashed_password,
            role="user",
            is_active=True,
            is_verified=True,
            email_verified=True,
            disabled=False,
            is_locked=False,
            customer_id="CUST-1001",
        )
        db.add(new_user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()

    # Seed admin user
    admin_email = "admin@example.com"
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if not admin_user:
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw("adminpassword".encode("utf-8"), salt).decode(
            "utf-8"
        )
        new_admin = User(
            email=admin_email,
            hashed_password=hashed_password,
            role="admin",
            is_active=True,
            is_verified=True,
            email_verified=True,
            disabled=False,
            is_locked=False,
            customer_id="CUST-9001",
        )
        db.add(new_admin)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
