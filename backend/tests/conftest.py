import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("SECRET_KEY", "test-secret-do-not-use-in-prod")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.database import Base, get_db  # noqa: E402
from app.main import app               # noqa: E402

TEST_DB_URL = "sqlite:///./test.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def client(fresh_db):
    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register_user(client, username="alice", email="alice@example.com", password="password123"):
    r = client.post("/auth/register", json={"username": username, "email": email, "password": password})
    assert r.status_code == 201, r.text
    return r.json()


def login_user(client, email="alice@example.com", password="password123"):
    r = client.post("/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def auth_headers(client, username="alice", email="alice@example.com", password="password123"):
    """Register a unique user and return their auth headers."""
    register_user(client, username=username, email=email, password=password)
    # Login always uses alice's credentials as base — pass email explicitly
    r = client.post("/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
