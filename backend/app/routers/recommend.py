
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import anthropic, json, os

from app.auth import get_current_user
from app.database import get_db
from app import models

router = APIRouter(prefix="/recommend", tags=["recommend"])
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class RecommendRequest(BaseModel):
    genres: list[str] = []
    mood: str = ""
    seed_titles: list[str] = []
    region: str = ""

@router.post("/")
def recommend(
    body: RecommendRequest,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_current_user),
):
    # Pull the user's history + favourites if logged in
    history_titles = []
    fav_titles = []
    if current_user:
        history_titles = [
            h.movie_title for h in
            db.query(models.WatchHistory)
              .filter_by(user_id=current_user.id)
              .order_by(models.WatchHistory.watched_at.desc())
              .limit(20).all()
        ]
        fav_titles = [
            f.movie_title for f in
            db.query(models.Favourite)
              .filter_by(user_id=current_user.id).all()
        ]

    parts = []
    if body.genres:      parts.append(f"Genres: {', '.join(body.genres)}")
    if body.mood:        parts.append(f"Mood: {body.mood}")
    if body.seed_titles: parts.append(f"Similar to: {', '.join(body.seed_titles)}")
    if body.region:      parts.append(f"Region: {body.region}")
    if fav_titles:       parts.append(f"User's favourites: {', '.join(fav_titles)}")
    if history_titles:   parts.append(f"Recently watched: {', '.join(history_titles[:10])}")

    prompt = f"""You are a film recommendation expert with deep knowledge of world cinema.
Based on: {' | '.join(parts)}

Return ONLY a JSON array of 8 films. Avoid recommending anything in the user's watch history.
No markdown, no preamble. Format:
[{{
  "title": "...", "year": 2020, "genre": "Drama / Thriller",
  "match_pct": 91,
  "description": "One sentence plot summary.",
  "why": "One sentence explaining why this fits this specific user."
}}]"""

    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = msg.content[0].text.strip().replace("```json","").replace("```","")
    return {"recommendations": json.loads(raw)}