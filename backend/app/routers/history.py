from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/", response_model=list[schemas.WatchHistoryOut])
def list_history(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.WatchHistory)
        .filter(models.WatchHistory.user_id == current_user.id)
        .order_by(models.WatchHistory.watched_at.desc())
        .limit(limit)
        .all()
    )


@router.post("/", response_model=schemas.WatchHistoryOut, status_code=201)
def add_to_history(
    body: schemas.WatchHistoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Each watch is recorded even if seen before (reflects re-watches)
    entry = models.WatchHistory(
        user_id=current_user.id,
        movie_id=body.movie_id,
        movie_title=body.movie_title,
        poster_path=body.poster_path,
        overview=body.overview,
        vote_average=body.vote_average,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(models.WatchHistory)
        .filter(
            models.WatchHistory.id == entry_id,
            models.WatchHistory.user_id == current_user.id,
        )
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    db.delete(entry)
    db.commit()


@router.delete("/", status_code=204)
def clear_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.WatchHistory).filter(
        models.WatchHistory.user_id == current_user.id
    ).delete()
    db.commit()
