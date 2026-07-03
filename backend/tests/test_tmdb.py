from unittest.mock import MagicMock, patch, AsyncMock
import httpx
from fastapi.testclient import TestClient


class TestHealth:
    def test_health(self, client: TestClient):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestTmdbProxy:
    def test_missing_api_key_returns_500(self, client: TestClient):
        with patch("app.tmdb_client.settings") as mock_settings:
            mock_settings.tmdb_api_key = ""
            r = client.get("/tmdb/genres")
            assert r.status_code in (500, 502)

    def test_genres_passes_through(self, client: TestClient):
        """Genres endpoint proxies the TMDB response correctly."""
        mock_payload = {"genres": [{"id": 28, "name": "Action"}]}

        # httpx response.json() is synchronous — use MagicMock not AsyncMock
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.is_success = True
        mock_response.status_code = 200
        mock_response.json.return_value = mock_payload

        with patch("app.tmdb_client._client") as mock_client:
            mock_client.get = AsyncMock(return_value=mock_response)
            r = client.get("/tmdb/genres")

        assert r.status_code == 200
        assert r.json()["genres"][0]["name"] == "Action"
