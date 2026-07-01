from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    favourites: Mapped[list["Favourite"]] = relationship(
        "Favourite", back_populates="user", cascade="all, delete-orphan"
    )
    watch_history: Mapped[list["WatchHistory"]] = relationship(
        "WatchHistory", back_populates="user", cascade="all, delete-orphan"
    )


class Favourite(Base):
    __tablename__ = "favourites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    movie_title: Mapped[str] = mapped_column(String(500), nullable=False)
    poster_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="favourites")


class WatchHistory(Base):
    __tablename__ = "watch_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    movie_title: Mapped[str] = mapped_column(String(500), nullable=False)
    poster_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    vote_average: Mapped[float | None] = mapped_column(nullable=True)
    watched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="watch_history")
