from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.anagrafica import router as anagrafica_router
from app.api.health import router as health_router
from app.api.moduli import router as moduli_router
from app.api.personale import router as personale_router
from app.config import get_settings
from app.database import SessionLocal
from app.seed import run_seed

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # TEMPORANEO: senza login reale, il backend lavora sempre con
    # l'azienda/utente di sviluppo (vedi app/core/deps.py). Il seed è
    # idempotente ed è limitato all'ambiente di sviluppo.
    if settings.environment == "development":
        db = SessionLocal()
        try:
            run_seed(db)
        finally:
            db.close()
    yield


app = FastAPI(title="Gestionale Cola API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(anagrafica_router)
app.include_router(personale_router)
app.include_router(moduli_router)
