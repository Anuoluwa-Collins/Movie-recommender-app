# Reel Backend

FastAPI backend for the Reel movie recommendation app. It does two things: proxies all TMDB API calls server-side (so the API key never touches the browser), and adds user accounts with favourites and watch history stored in SQLite.

## Stack

- **FastAPI** — API framework with auto-generated docs at `/docs`
- **SQLAlchemy** — ORM for database models
- **Alembic** — database migrations
- **SQLite** — file-based database (`reel.db`)
- **bcrypt** — password hashing
- **python-jose** — JWT token signing
- **httpx** — async TMDB proxy client

## Project structure

```
app/
  main.py          FastAPI app, CORS, lifespan (table creation)
  config.py        Settings loaded from .env via pydantic-settings
  database.py      SQLAlchemy engine, session, Base
  models.py        User, Favourite, WatchHistory ORM models
  schemas.py       Pydantic request/response schemas
  auth.py          Password hashing, JWT creation, get_current_user dependency
  tmdb_client.py   Async TMDB proxy (injects API key, handles errors)
  routers/
    auth.py        POST /auth/register, POST /auth/login, GET /auth/me
    tmdb.py        GET /tmdb/genres, /search, /discover, /movie/{id}, etc.
    favourites.py  GET/POST /favourites/, DELETE /favourites/{movie_id}
    history.py     GET/POST /history/, DELETE /history/{id}, DELETE /history/
alembic/           Migration scripts
```

## Getting started

### 1. Create and activate a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set:

- `TMDB_API_KEY` — your TMDB v3 key (same one as the frontend used to use)
- `SECRET_KEY` — a long random string for JWT signing:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```

### 4. Run database migrations

```bash
alembic upgrade head
```

This creates `reel.db` with the `users`, `favourites`, and `watch_history` tables.

### 5. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

The API is now running at `http://localhost:8000`.
Interactive docs (Swagger UI) at `http://localhost:8000/docs`.

## API overview

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Returns JWT token |
| GET | `/auth/me` | ✓ | Current user info |

### TMDB proxy
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tmdb/genres` | Movie genre list |
| GET | `/tmdb/search?q=` | Search movies |
| GET | `/tmdb/discover` | Discover with genre/region/sort |
| GET | `/tmdb/movie/{id}` | Movie detail |
| GET | `/tmdb/movie/{id}/recommendations` | TMDB recommendations |
| GET | `/tmdb/movie/{id}/similar` | Similar movies |

### Favourites (requires token)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/favourites/` | List favourites |
| POST | `/favourites/` | Add a favourite |
| DELETE | `/favourites/{movie_id}` | Remove a favourite |

### Watch history (requires token)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/history/` | List history (latest first) |
| POST | `/history/` | Add entry (re-watches allowed) |
| DELETE | `/history/{entry_id}` | Remove one entry |
| DELETE | `/history/` | Clear all history |

## Connecting the frontend

Remove `VITE_TMDB_API_KEY` from the frontend `.env` and update `src/lib/tmdb.ts` to call `http://localhost:8000/tmdb/...` instead of `https://api.themoviedb.org/3/...`. The path and query param shapes are identical.

For authenticated requests, store the JWT from `/auth/login` in memory (or `localStorage`) and send it as:
```
Authorization: Bearer <token>
```

## Adding future migrations

After changing `app/models.py`:

```bash
alembic revision --autogenerate -m "describe_your_change"
alembic upgrade head
```

## Notes

- The TMDB API key lives only in the server's `.env` — the browser never sees it.
- Passwords are hashed with bcrypt before storage; plain-text passwords are never persisted.
- Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60). Set a shorter value in production.
- For production, swap SQLite for PostgreSQL by changing `DATABASE_URL` — no other code changes needed.
