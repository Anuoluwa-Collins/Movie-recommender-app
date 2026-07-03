from fastapi.testclient import TestClient

from tests.conftest import auth_headers


PAYLOAD = {"movie_id": 550, "movie_title": "Fight Club", "poster_path": "/abc.jpg"}


class TestFavourites:
    def test_empty_list(self, client: TestClient):
        headers = auth_headers(client)
        r = client.get("/favourites/", headers=headers)
        assert r.status_code == 200
        assert r.json() == []

    def test_add_favourite(self, client: TestClient):
        headers = auth_headers(client)
        r = client.post("/favourites/", headers=headers, json=PAYLOAD)
        assert r.status_code == 201
        body = r.json()
        assert body["movie_id"] == 550
        assert body["movie_title"] == "Fight Club"
        assert body["poster_path"] == "/abc.jpg"

    def test_list_after_add(self, client: TestClient):
        headers = auth_headers(client)
        client.post("/favourites/", headers=headers, json=PAYLOAD)
        r = client.get("/favourites/", headers=headers)
        assert len(r.json()) == 1

    def test_duplicate_blocked(self, client: TestClient):
        headers = auth_headers(client)
        client.post("/favourites/", headers=headers, json=PAYLOAD)
        r = client.post("/favourites/", headers=headers, json=PAYLOAD)
        assert r.status_code == 409

    def test_remove_favourite(self, client: TestClient):
        headers = auth_headers(client)
        client.post("/favourites/", headers=headers, json=PAYLOAD)
        r = client.delete("/favourites/550", headers=headers)
        assert r.status_code == 204
        assert client.get("/favourites/", headers=headers).json() == []

    def test_remove_nonexistent(self, client: TestClient):
        headers = auth_headers(client)
        r = client.delete("/favourites/9999", headers=headers)
        assert r.status_code == 404

    def test_users_isolated(self, client: TestClient):
        """Alice's favourites should not be visible to Bob."""
        alice = auth_headers(client, username="alice", email="alice@example.com")
        bob = auth_headers(client, username="bob", email="bob@example.com")
        client.post("/favourites/", headers=alice, json=PAYLOAD)
        r = client.get("/favourites/", headers=bob)
        assert r.json() == []

    def test_unauthenticated(self, client: TestClient):
        r = client.get("/favourites/")
        assert r.status_code == 401
