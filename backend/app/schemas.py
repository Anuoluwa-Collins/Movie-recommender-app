from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 50:
            raise ValueError("Username must be 50 characters or fewer")
        return v

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int | None = None


# ── Favourites ────────────────────────────────────────────────────────────────

class FavouriteCreate(BaseModel):
    movie_id: int
    movie_title: str
    poster_path: str | None = None


class FavouriteOut(BaseModel):
    id: int
    movie_id: int
    movie_title: str
    poster_path: str | None
    added_at: datetime

    model_config = {"from_attributes": True}


# ── Watch history ─────────────────────────────────────────────────────────────

class WatchHistoryCreate(BaseModel):
    movie_id: int
    movie_title: str
    poster_path: str | None = None
    overview: str | None = None
    vote_average: float | None = None


class WatchHistoryOut(BaseModel):
    id: int
    movie_id: int
    movie_title: str
    poster_path: str | None
    overview: str | None
    vote_average: float | None
    watched_at: datetime

    model_config = {"from_attributes": True}
