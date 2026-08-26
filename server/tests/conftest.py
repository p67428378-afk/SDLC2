import pytest
from collections.abc import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from server.database import Base, get_db
from server.main import app
from server.models import Project, User
from server.security import create_access_token, get_password_hash

# In-memory test SQLite engine
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_employee_user(db_session: Session) -> User:
    user = db_session.query(User).filter(User.email == "test_emp@example.com").first()
    if not user:
        user = User(
            email="test_emp@example.com",
            password_hash=get_password_hash("password123"),
            role="Employee",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user


@pytest.fixture
def test_manager_user(db_session: Session) -> User:
    user = db_session.query(User).filter(User.email == "test_mgr@example.com").first()
    if not user:
        user = User(
            email="test_mgr@example.com",
            password_hash=get_password_hash("password123"),
            role="Manager",
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user


@pytest.fixture
def employee_headers(test_employee_user: User) -> dict[str, str]:
    token = create_access_token(
        data={
            "sub": test_employee_user.id,
            "email": test_employee_user.email,
            "role": test_employee_user.role,
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def manager_headers(test_manager_user: User) -> dict[str, str]:
    token = create_access_token(
        data={
            "sub": test_manager_user.id,
            "email": test_manager_user.email,
            "role": test_manager_user.role,
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def active_project(db_session: Session) -> Project:
    proj = Project(
        name="Active Project 1",
        description="Active test project",
        active_status=True,
    )
    db_session.add(proj)
    db_session.commit()
    db_session.refresh(proj)
    return proj


@pytest.fixture
def inactive_project(db_session: Session) -> Project:
    proj = Project(
        name="Inactive Project 1",
        description="Inactive test project",
        active_status=False,
    )
    db_session.add(proj)
    db_session.commit()
    db_session.refresh(proj)
    return proj
