import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from server.config import settings

DATABASE_URL = os.getenv("DATABASE_URL", settings.DATABASE_URL)

connect_args = {}
poolclass = None

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    poolclass = StaticPool

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    poolclass=poolclass,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_data(db):
    from server.models import User
    from server.auth import get_password_hash
    from sqlalchemy.exc import IntegrityError

    seed_users = [
        {
            "username": "test@example.com",
            "password": "testpassword",
            "fiserv_cif_id": "CIF-98421",
            "cenlar_customer_id": "CEN-98421",
        },
        {
            "username": "admin@example.com",
            "password": "adminpassword",
            "fiserv_cif_id": "CIF-ADMIN",
            "cenlar_customer_id": "CEN-ADMIN",
        },
    ]

    for u in seed_users:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if existing:
            continue

        hashed = get_password_hash(u["password"])
        db_user = User(
            username=u["username"],
            hashed_password=hashed,
            fiserv_cif_id=u["fiserv_cif_id"],
            cenlar_customer_id=u["cenlar_customer_id"],
        )
        db.add(db_user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
