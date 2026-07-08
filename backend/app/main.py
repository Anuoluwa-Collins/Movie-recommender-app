from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, favourites, history, tmdb, recommend

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (Alembic handles migrations in production)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Reel API",
    description="Backend for the Reel movie recommendation app — TMDB proxy + user accounts.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tmdb.router)
app.include_router(favourites.router)
app.include_router(history.router)
app.include_router(recommend.router)

@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "version": app.version}
