import os
from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import IntegrityError

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./timesheet.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    future=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Ensure models are imported so tables register on Base.metadata
    from server import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def seed_data(db: Session) -> None:
    from server.models import User, Project
    from server.security import get_password_hash

    # Seed Default Employee Test Account
    try:
        emp_user = db.query(User).filter(User.email == "test@example.com").first()
        if not emp_user:
            emp_user = User(
                email="test@example.com",
                password_hash=get_password_hash("testpassword"),
                role="Employee",
            )
            db.add(emp_user)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed Default Manager Test Account
    try:
        mgr_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not mgr_user:
            mgr_user = User(
                email="admin@example.com",
                password_hash=get_password_hash("adminpassword"),
                role="Manager",
            )
            db.add(mgr_user)
            db.commit()
    except IntegrityError:
        db.rollback()

    # Seed Initial Projects
    projects_to_seed = [
        {
            "name": "Project Alpha",
            "description": "Core System Enhancement",
            "active_status": True,
        },
        {
            "name": "Project Beta",
            "description": "Internal Process Automation",
            "active_status": True,
        },
    ]

    for p_data in projects_to_seed:
        try:
            proj = db.query(Project).filter(Project.name == p_data["name"]).first()
            if not proj:
                proj = Project(
                    name=p_data["name"],
                    description=p_data["description"],
                    active_status=p_data["active_status"],
                )
                db.add(proj)
                db.commit()
        except IntegrityError:
            db.rollback()
