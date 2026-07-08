import json
import logging

import anthropic
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user_optional
from app.config import settings
from app.database import get_db
from app.main import limiter

router = APIRouter(prefix="/recommend", tags=["recommend"])
logger = logging.getLogger("reel.recommend")

# One client, reused across requests — avoids reconnect overhead per call.
_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _build_prompt(body: schemas.RecommendRequest, fav_titles: list[str], history_titles: list[str]) -> str:
    """
    All user-controlled values are pre-truncated by the Pydantic validators
    on RecommendRequest, and are placed inside a clearly delimited "Context"
    block. This doesn't make prompt injection impossible, but it keeps user
    text out of the instruction portion of the prompt and caps how much
    influence any single field can have.
    """
    context_lines = []
    if body.genres:
        context_lines.append(f"Genres: {', '.join(body.genres)}")
    if body.mood:
        context_lines.append(f"Mood: {body.mood}")
    if body.seed_titles:
        context_lines.append(f"Similar to: {', '.join(body.seed_titles)}")
    if body.region:
        context_lines.append(f"Region: {body.region}")
    if fav_titles:
        context_lines.append(f"User's favourites: {', '.join(fav_titles[:20])}")
    if history_titles:
        context_lines.append(f"Recently watched (avoid repeating these): {', '.join(history_titles[:10])}")

    context = "\n".join(context_lines) or "No specific preferences given — suggest broadly popular, well-regarded films."

    return f"""You are a film recommendation expert with deep knowledge of world cinema.

<context>
{context}
</context>

Using only the context above, recommend exactly 8 films. Return ONLY a raw JSON
array — no markdown fences, no preamble, no commentary. Each item must match
exactly:
[{{"title": "...", "year": 2020, "genre": "Drama / Thriller", "match_pct": 91,
   "description": "One sentence plot summary.", "why": "One sentence on fit."}}]"""


@router.post("/", response_model=schemas.RecommendResponse)
@limiter.limit("15/minute")  # Anthropic calls cost money — throttle abuse
def recommend(
    request: Request,
    body: schemas.RecommendRequest,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_current_user_optional),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="Recommendations are temporarily unavailable")

    fav_titles: list[str] = []
    history_titles: list[str] = []
    if current_user:
        fav_titles = [f.movie_title for f in
                      db.query(models.Favourite).filter_by(user_id=current_user.id).all()]
        history_titles = [h.movie_title for h in
                           db.query(models.WatchHistory)
                             .filter_by(user_id=current_user.id)
                             .order_by(models.WatchHistory.watched_at.desc())
                             .limit(20).all()]

    prompt = _build_prompt(body, fav_titles, history_titles)

    try:
        message = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIError as exc:
        logger.error("Anthropic API error: %s", exc)
        raise HTTPException(status_code=502, detail="Recommendation service is unavailable right now")

    raw = message.content[0].text.strip().removeprefix("```json").removesuffix("```").strip()

    # Never trust the model's output shape — parse defensively and validate
    # through the strict Pydantic schema before it reaches the client.
    try:
        parsed = json.loads(raw)
        validated = schemas.RecommendResponse(recommendations=parsed)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.error("Malformed LLM response: %s | raw=%r", exc, raw[:500])
        raise HTTPException(status_code=502, detail="Couldn't generate recommendations — try again")

    return validated