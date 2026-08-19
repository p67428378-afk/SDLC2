import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
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


def seed_data(db: Session):
    from server.models.project import Project
    import uuid

    # Check if default projects exist
    existing = db.query(Project).first()
    if not existing:
        try:
            p1 = Project(
                id=str(uuid.uuid4()), name="Website Redesign", color_code="#3B82F6"
            )
            p2 = Project(
                id=str(uuid.uuid4()), name="Internal Admin", color_code="#6B7280"
            )
            db.add_all([p1, p2])
            db.commit()
        except Exception:
            db.rollback()
