from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/favourites", tags=["favourites"])


@router.get("/", response_model=list[schemas.FavouriteOut])
def list_favourites(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Favourite)
        .filter(models.Favourite.user_id == current_user.id)
        .order_by(models.Favourite.added_at.desc())
        .all()
    )


@router.post("/", response_model=schemas.FavouriteOut, status_code=201)
def add_favourite(
    body: schemas.FavouriteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.Favourite)
        .filter(
            models.Favourite.user_id == current_user.id,
            models.Favourite.movie_id == body.movie_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Movie already in favourites")

    fav = models.Favourite(
        user_id=current_user.id,
        movie_id=body.movie_id,
        movie_title=body.movie_title,
        poster_path=body.poster_path,
    )
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


@router.delete("/{movie_id}", status_code=204)
def remove_favourite(
    movie_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fav = (
        db.query(models.Favourite)
        .filter(
            models.Favourite.user_id == current_user.id,
            models.Favourite.movie_id == movie_id,
        )
        .first()
    )
    if not fav:
        raise HTTPException(status_code=404, detail="Favourite not found")
    db.delete(fav)
    db.commit()
