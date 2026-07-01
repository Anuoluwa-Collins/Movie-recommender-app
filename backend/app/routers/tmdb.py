from fastapi import APIRouter, Query

from app.tmdb_client import tmdb_get

router = APIRouter(prefix="/tmdb", tags=["tmdb"])


@router.get("/genres")
async def genres():
    return await tmdb_get("/genre/movie/list")


@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    return await tmdb_get("/search/movie", {"query": q, "include_adult": "false"})


@router.get("/discover")
async def discover(
    with_genres: str = Query(default=""),
    sort_by: str = Query(default="popularity.desc"),
    page: int = Query(default=1, ge=1, le=500),
    with_origin_country: str = Query(default=""),
    vote_count_gte: int = Query(default=100, alias="vote_count.gte"),
):
    return await tmdb_get(
        "/discover/movie",
        {
            "with_genres": with_genres,
            "sort_by": sort_by,
            "page": page,
            "with_origin_country": with_origin_country,
            "vote_count.gte": vote_count_gte,
            "include_adult": "false",
        },
    )


@router.get("/movie/{movie_id}")
async def movie_detail(movie_id: int):
    return await tmdb_get(f"/movie/{movie_id}")


@router.get("/movie/{movie_id}/recommendations")
async def recommendations(movie_id: int):
    return await tmdb_get(f"/movie/{movie_id}/recommendations")


@router.get("/movie/{movie_id}/similar")
async def similar(movie_id: int):
    return await tmdb_get(f"/movie/{movie_id}/similar")
