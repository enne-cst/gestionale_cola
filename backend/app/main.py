from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.anagrafica import router as anagrafica_router
from app.api.anagrafica_registry import router as anagrafica_registry_router
from app.api.auth import router as auth_router
from app.api.consulente import router as consulente_router
from app.api.health import router as health_router
from app.api.moduli import router as moduli_router
from app.api.panoramica import router as panoramica_router
from app.api.personale import router as personale_router
from app.api.personale_occupazione import router as personale_occupazione_router
from app.api.sezioni import router as sezioni_router
from app.api.sistema import router as sistema_router
from app.api.superadmin import router as superadmin_router
from app.api.titoli_abilitativi import router as titoli_abilitativi_router
from app.api.verifica_modifiche import router as verifica_modifiche_router
from app.config import get_settings
from app.database import SessionLocal
from app.seed import run_seed

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crea (idempotente) azienda/utenti di sviluppo con credenziali note,
    # per poter testare subito il login senza passare dal form del
    # consulente. Limitato all'ambiente di sviluppo (vedi app/seed.py).
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
app.include_router(auth_router)
app.include_router(consulente_router)
app.include_router(superadmin_router)
app.include_router(anagrafica_router)
app.include_router(anagrafica_registry_router)
app.include_router(titoli_abilitativi_router)
app.include_router(personale_router)
app.include_router(personale_occupazione_router)
app.include_router(moduli_router)
app.include_router(sezioni_router)
app.include_router(sistema_router)
app.include_router(panoramica_router)
app.include_router(verifica_modifiche_router)
