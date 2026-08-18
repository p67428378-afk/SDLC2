import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/app.db")

# For SQLite, check_same_thread is needed
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

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
    from server.models.project import Project  # noqa: F401
    from server.models.time_entry import TimeEntry  # noqa: F401
    Base.metadata.create_all(bind=engine)

def seed_data(db):
    from server.models.project import Project
    # Check if any project exists
    existing = db.query(Project).first()
    if not existing:
        default_proj = Project(
            name="Default Project",
            color_code="#6B7280"
        )
        try:
            db.add(default_proj)
            db.commit()
            db.refresh(default_proj)
        except Exception:
            db.rollback()
