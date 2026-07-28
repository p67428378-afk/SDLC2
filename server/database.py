import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import IntegrityError
from server.config import settings

# SQLAlchemy Base
Base = declarative_base()

# Create Engine
# For SQLite, we need connect_args={"check_same_thread": False}
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database schema."""
    # Import models here to register them on Base.metadata
    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    """Seed default users for testing and QA."""
    from server.models import User
    from server.auth import get_password_hash

    # Seed regular user
    test_username = "test@example.com"
    test_user = db.query(User).filter(User.username == test_username).first()
    if not test_user:
        try:
            test_user = User(
                id=str(uuid.uuid4()),
                username=test_username,
                hashed_password=get_password_hash("testpassword"),
                fiserv_cif_id="CIF-98421",
                cenlar_customer_id="CEN-55102",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        except IntegrityError:
            db.rollback()
            test_user = db.query(User).filter(User.username == test_username).first()

    # Seed admin user
    admin_username = "admin@example.com"
    admin_user = db.query(User).filter(User.username == admin_username).first()
    if not admin_user:
        try:
            admin_user = User(
                id=str(uuid.uuid4()),
                username=admin_username,
                hashed_password=get_password_hash("adminpassword"),
                fiserv_cif_id="CIF-11111",
                cenlar_customer_id="CEN-22222",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        except IntegrityError:
            db.rollback()
            admin_user = db.query(User).filter(User.username == admin_username).first()
