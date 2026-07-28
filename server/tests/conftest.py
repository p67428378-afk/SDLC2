import pytest
from fastapi.testclient import TestClient
from server.database import Base, get_db, seed_data
from server.main import app

# Try to import from test_acceptance_qa if it exists in the python path to share the same engine and session
try:
    import test_acceptance_qa

    engine = test_acceptance_qa.engine
    TestingSessionLocal = test_acceptance_qa.TestingSessionLocal
except ImportError:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    TEST_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _create_schema_once():
    # Import models first so they register on Base.metadata
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    """Function-scoped: wipe DATA (not schema) between tests so state doesn't leak."""
    # Before test: seed the data!
    db = TestingSessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    yield
    # After test: wipe the data!
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
def client():
    with TestClient(app) as c:
        yield c
