import time
from fastapi.testclient import TestClient
from tests.conftest import auth_headers

PAYLOAD = {
    "movie_id": 550,
    "movie_title": "Fight Club",
    "poster_path": "/abc.jpg",
    "overview": "An insomniac office worker...",
    "vote_average": 8.4,
}


class TestHistory:
    def test_empty_history(self, client: TestClient):
        headers = auth_headers(client)
        r = client.get("/history/", headers=headers)
        assert r.status_code == 200
        assert r.json() == []

    def test_add_entry(self, client: TestClient):
        headers = auth_headers(client)
        r = client.post("/history/", headers=headers, json=PAYLOAD)
        assert r.status_code == 201
        body = r.json()
        assert body["movie_id"] == 550
        assert body["vote_average"] == 8.4

    def test_rewatches_allowed(self, client: TestClient):
        headers = auth_headers(client)
        client.post("/history/", headers=headers, json=PAYLOAD)
        client.post("/history/", headers=headers, json=PAYLOAD)
        r = client.get("/history/", headers=headers)
        assert len(r.json()) == 2

    def test_list_ordered_newest_first(self, client: TestClient):
        headers = auth_headers(client)
        client.post("/history/", headers=headers, json={**PAYLOAD, "movie_id": 1, "movie_title": "First"})
        # Small sleep ensures different timestamps at second resolution in SQLite
        time.sleep(1.1)
        client.post("/history/", headers=headers, json={**PAYLOAD, "movie_id": 2, "movie_title": "Second"})
        r = client.get("/history/", headers=headers)
        titles = [e["movie_title"] for e in r.json()]
        assert titles[0] == "Second"

    def test_delete_entry(self, client: TestClient):
        headers = auth_headers(client)
        entry = client.post("/history/", headers=headers, json=PAYLOAD).json()
        r = client.delete(f"/history/{entry['id']}", headers=headers)
        assert r.status_code == 204
        assert client.get("/history/", headers=headers).json() == []

    def test_delete_nonexistent(self, client: TestClient):
        headers = auth_headers(client)
        r = client.delete("/history/9999", headers=headers)
        assert r.status_code == 404

    def test_clear_all(self, client: TestClient):
        headers = auth_headers(client)
        client.post("/history/", headers=headers, json=PAYLOAD)
        client.post("/history/", headers=headers, json=PAYLOAD)
        r = client.delete("/history/", headers=headers)
        assert r.status_code == 204
        assert client.get("/history/", headers=headers).json() == []

    def test_users_isolated(self, client: TestClient):
        alice = auth_headers(client, username="alice", email="alice@example.com")
        bob = auth_headers(client, username="bob", email="bob@example.com")
        client.post("/history/", headers=alice, json=PAYLOAD)
        r = client.get("/history/", headers=bob)
        assert r.json() == []

    def test_unauthenticated(self, client: TestClient):
        r = client.get("/history/")
        assert r.status_code == 401
