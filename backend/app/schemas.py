import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator, ConfigDict


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    # extra="forbid" rejects unexpected fields instead of silently ignoring
    # them — cheap protection against mass-assignment style payloads.
    model_config = ConfigDict(extra="forbid")

    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        v = v.strip()
        if not (3 <= len(v) <= 50):
            raise ValueError("Username must be 3–50 characters")
        if not re.fullmatch(r"[A-Za-z0-9_.-]+", v):
            raise ValueError("Username may only contain letters, numbers, . _ -")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password is too long")  # bcrypt truncates at 72 bytes
        if not re.search(r"[a-z]", v) or not re.search(r"[A-Z]", v) or not re.search(r"\d", v):
            raise ValueError("Password needs at least one lowercase, uppercase, and digit")
        return v


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int | None = None


# ── Favourites ────────────────────────────────────────────────────────────────

class FavouriteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    movie_id: int
    movie_title: str = ""
    poster_path: str | None = None

    @field_validator("movie_title")
    @classmethod
    def cap_title(cls, v: str) -> str:
        return v[:500]  # matches the DB column width — belt and suspenders


class FavouriteOut(BaseModel):
    id: int
    movie_id: int
    movie_title: str
    poster_path: str | None
    added_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── Watch history ─────────────────────────────────────────────────────────────

class WatchHistoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    movie_id: int
    movie_title: str = ""
    poster_path: str | None = None
    overview: str | None = None
    vote_average: float | None = None

    @field_validator("movie_title")
    @classmethod
    def cap_title(cls, v: str) -> str:
        return v[:500]

    @field_validator("overview")
    @classmethod
    def cap_overview(cls, v: str | None) -> str | None:
        return v[:2000] if v else v


class WatchHistoryOut(BaseModel):
    id: int
    movie_id: int
    movie_title: str
    poster_path: str | None
    overview: str | None
    vote_average: float | None
    watched_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── AI recommendations ───────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    genres: list[str] = []
    mood: str = ""
    seed_titles: list[str] = []
    region: str = ""

    # Every free-text field gets capped — this is what goes into the LLM
    # prompt, so unbounded input is both a cost/DoS vector and a widened
    # surface for prompt injection.
    @field_validator("genres", "seed_titles")
    @classmethod
    def cap_list(cls, v: list[str]) -> list[str]:
        return [item.strip()[:80] for item in v[:10] if item.strip()]

    @field_validator("mood", "region")
    @classmethod
    def cap_text(cls, v: str) -> str:
        return v.strip()[:80]


class RecommendedFilm(BaseModel):
    """Strict shape we require back from the model before trusting it."""
    title: str
    year: int
    genre: str
    match_pct: int
    description: str
    why: str


class RecommendResponse(BaseModel):
    recommendations: list[RecommendedFilm]