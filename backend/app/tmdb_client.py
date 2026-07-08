import httpx
from fastapi import HTTPException

from app.config import settings

TMDB_BASE = "https://api.themoviedb.org/3"
_client = httpx.AsyncClient(timeout=10.0)


async def tmdb_get(path: str, params: dict | None = None) -> dict:
    if not settings.tmdb_api_key:
        raise HTTPException(status_code=500, detail="TMDB API key not configured on server")

    # v4 read access tokens are sent as a Bearer header, not a query param
    headers = {"Authorization": f"Bearer {settings.tmdb_api_key}"}
    merged = {k: v for k, v in (params or {}).items() if v is not None and v != ""}

    try:
        response = await _client.get(TMDB_BASE + path, params=merged, headers=headers)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"TMDB unreachable: {exc}")

    if response.status_code == 401:
        raise HTTPException(status_code=502, detail="Invalid TMDB API key on server")
    if not response.is_success:
        raise HTTPException(status_code=502, detail=f"TMDB error {response.status_code}")

    return response.json()