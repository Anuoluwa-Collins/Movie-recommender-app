import pytest
from fastapi.testclient import TestClient

from tests.conftest import auth_headers, login_user, register_user


class TestRegister:
    def test_success(self, client: TestClient):
        r = client.post(
            "/auth/register",
            json={"username": "bob", "email": "bob@example.com", "password": "securepass1"},
        )
        assert r.status_code == 201
        body = r.json()
        assert body["username"] == "bob"
        assert body["email"] == "bob@example.com"
        assert "hashed_password" not in body

    def test_duplicate_email(self, client: TestClient):
        register_user(client)
        r = client.post(
            "/auth/register",
            json={"username": "alice2", "email": "alice@example.com", "password": "password123"},
        )
        assert r.status_code == 409
        assert "Email" in r.json()["detail"]

    def test_duplicate_username(self, client: TestClient):
        register_user(client)
        r = client.post(
            "/auth/register",
            json={"username": "alice", "email": "other@example.com", "password": "password123"},
        )
        assert r.status_code == 409
        assert "Username" in r.json()["detail"]

    def test_password_too_short(self, client: TestClient):
        r = client.post(
            "/auth/register",
            json={"username": "bob", "email": "bob@example.com", "password": "short"},
        )
        assert r.status_code == 422

    def test_username_too_short(self, client: TestClient):
        r = client.post(
            "/auth/register",
            json={"username": "ab", "email": "ab@example.com", "password": "password123"},
        )
        assert r.status_code == 422

    def test_invalid_email(self, client: TestClient):
        r = client.post(
            "/auth/register",
            json={"username": "bob", "email": "not-an-email", "password": "password123"},
        )
        assert r.status_code == 422


class TestLogin:
    def test_login_with_email(self, client: TestClient):
        register_user(client)
        r = client.post(
            "/auth/login",
            data={"username": "alice@example.com", "password": "password123"},
        )
        assert r.status_code == 200
        assert "access_token" in r.json()
        assert r.json()["token_type"] == "bearer"

    def test_login_with_username(self, client: TestClient):
        register_user(client)
        r = client.post(
            "/auth/login",
            data={"username": "alice", "password": "password123"},
        )
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_wrong_password(self, client: TestClient):
        register_user(client)
        r = client.post(
            "/auth/login",
            data={"username": "alice@example.com", "password": "wrongpassword"},
        )
        assert r.status_code == 401

    def test_unknown_user(self, client: TestClient):
        r = client.post(
            "/auth/login",
            data={"username": "nobody@example.com", "password": "password123"},
        )
        assert r.status_code == 401


class TestMe:
    def test_returns_current_user(self, client: TestClient):
        headers = auth_headers(client)
        r = client.get("/auth/me", headers=headers)
        assert r.status_code == 200
        assert r.json()["username"] == "alice"

    def test_unauthenticated(self, client: TestClient):
        r = client.get("/auth/me")
        assert r.status_code == 401

    def test_invalid_token(self, client: TestClient):
        r = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
        assert r.status_code == 401
