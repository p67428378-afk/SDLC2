import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from server.database import Base, get_db, seed_data
from server.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _create_schema_once():
    # Import models to register them on Base.metadata
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
def test_user(db_session):
    # Seed the test user
    seed_data(db_session)
    from server.models import User

    return db_session.query(User).filter(User.username == "test@example.com").first()


@pytest.fixture
def auth_headers(client, test_user):
    # Login and get token
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    mfa_token = response.json()["mfa_token"]

    # Verify MFA
    response = client.post(
        "/api/v1/auth/mfa/verify", json={"code": "123456", "mfa_token": mfa_token}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
