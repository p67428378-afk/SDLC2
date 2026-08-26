import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import server.models  # noqa: F401
from server.database import Base, get_db
from server.models.user import User
from server.models.project import Project
from server.services.auth import get_password_hash, create_access_token
from server.main import app

os.environ["TESTING"] = "true"

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _create_schema_once():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    """Function-scoped: wipe DATA (not schema) between tests so state doesn't leak."""
    yield
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def employee_user(db_session):
    user = User(
        email="emp@example.com",
        hashed_password=get_password_hash("password123"),
        role="Employee",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def manager_user(db_session):
    user = User(
        email="mgr@example.com",
        hashed_password=get_password_hash("password123"),
        role="Manager",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def employee_token(employee_user):
    return create_access_token(
        data={
            "sub": employee_user.id,
            "email": employee_user.email,
            "role": employee_user.role,
        }
    )


@pytest.fixture
def manager_token(manager_user):
    return create_access_token(
        data={
            "sub": manager_user.id,
            "email": manager_user.email,
            "role": manager_user.role,
        }
    )


@pytest.fixture
def test_project(db_session):
    project = Project(
        name="Test Project",
        description="Project for test cases",
        active_status=True,
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project


@pytest.fixture
def inactive_project(db_session):
    project = Project(
        name="Inactive Project",
        description="Inactive project for test cases",
        active_status=False,
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project
