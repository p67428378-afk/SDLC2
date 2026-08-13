import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.main import app
from server.database import Base, get_db, seed_data

# SQLite in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture(scope="function")
def db_session(test_engine):
    Session = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = Session()

    # Seed data for each test function to ensure clean state
    seed_data(session)

    try:
        yield session
    finally:
        session.close()
        # Clean up tables after each test to avoid pollution
        # Using connection to execute delete statements in SQLAlchemy 2.0
        with test_engine.connect() as connection:
            for table in reversed(Base.metadata.sorted_tables):
                connection.execute(table.delete())
            connection.commit()


@pytest.fixture(scope="function")
def client(db_session):
    # Override get_db dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
