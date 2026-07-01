import httpx
from fastapi import HTTPException

from app.config import settings

TMDB_BASE = "https://api.themoviedb.org/3"
# Shared async client with a 10-second timeout and connection pooling
_client = httpx.AsyncClient(timeout=10.0)


async def tmdb_get(path: str, params: dict | None = None) -> dict:
    """
    Make a GET request to TMDB, injecting the server-side API key.
    Raises HTTPException so FastAPI can pass the right status code to the client.
    """
    if not settings.tmdb_api_key:
        raise HTTPException(status_code=500, detail="TMDB API key not configured on server")

    merged: dict = {"api_key": settings.tmdb_api_key, **(params or {})}
    # Remove empty/None values so TMDB doesn't get confused by blank params
    merged = {k: v for k, v in merged.items() if v is not None and v != ""}

    try:
        response = await _client.get(TMDB_BASE + path, params=merged)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"TMDB unreachable: {exc}")

    if response.status_code == 401:
        raise HTTPException(status_code=502, detail="Invalid TMDB API key on server")
    if not response.is_success:
        raise HTTPException(status_code=502, detail=f"TMDB error {response.status_code}")

    return response.json()
