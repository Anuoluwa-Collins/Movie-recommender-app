from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import Base, engine
from app.limiter import limiter          # ← now imported, not defined here
from app.routers import auth, favourites, history, tmdb, recommend


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_for_production()
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Reel API",
    description="Backend for the Reel movie recommendation app.",
    version="1.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


app.include_router(auth.router)
app.include_router(tmdb.router)
app.include_router(favourites.router)
app.include_router(history.router)
app.include_router(recommend.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "version": app.version}