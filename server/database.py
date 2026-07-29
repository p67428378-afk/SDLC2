from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from server.config import settings

# For SQLite, we need connect_args={"check_same_thread": False}
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models here to register them on Base
    Base.metadata.create_all(bind=engine)


def seed_data(db):
    from server.models import User
    from server.auth import get_password_hash

    # Check if test user already exists
    test_user = db.query(User).filter(User.username == "test@example.com").first()
    if not test_user:
        hashed_pw = get_password_hash("testpassword")
        test_user = User(
            username="test@example.com",
            hashed_password=hashed_pw,
            fiserv_cif="CIF-982341",
            cenlar_customer_id="CEN-554321",
        )
        db.add(test_user)
        try:
            db.commit()
            db.refresh(test_user)
        except Exception:
            db.rollback()
