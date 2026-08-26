from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.exc import IntegrityError
from server.config import settings


class Base(DeclarativeBase):
    pass


connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Ensure all models are imported so their tables register on Base.metadata
    import server.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


_SEED_USERS = [
    {"email": "employee@example.com", "password": "employee123", "role": "Employee"},
    {"email": "manager@example.com", "password": "manager123", "role": "Manager"},
    {"email": "test@example.com", "password": "testpassword", "role": "Employee"},
    {"email": "admin@example.com", "password": "adminpassword", "role": "Manager"},
]

_SEED_PROJECTS = [
    {
        "name": "Project Alpha",
        "description": "Primary Client Deliverable",
        "active_status": True,
    },
    {
        "name": "Project Beta",
        "description": "Internal Infrastructure",
        "active_status": True,
    },
]


def seed_data(db) -> None:
    from server.models.user import User
    from server.models.project import Project
    from server.services.auth import get_password_hash

    for u in _SEED_USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"],
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()

    for p in _SEED_PROJECTS:
        existing = db.query(Project).filter(Project.name == p["name"]).first()
        if not existing:
            project = Project(
                name=p["name"],
                description=p["description"],
                active_status=p["active_status"],
            )
            db.add(project)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
