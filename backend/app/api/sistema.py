"""Endpoint di sistema trasversali ai moduli applicativi (non legati a una
singola area funzionale come Anagrafica o Personale)."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, UtenteContext, get_current_azienda, get_current_user
from app.database import get_db
from app.models.sistema import CatCertificazione, CatStatoCertificazione, SysAzienda
from app.schemas.abbonamenti import CertificazioneCatalogoRead, StatoCertificazioneRead

router = APIRouter(prefix="/api/sistema", tags=["Sistema"])


class AziendaCorrenteRead(BaseModel):
    id: str
    ragione_sociale: str


@router.get("/azienda-corrente", response_model=AziendaCorrenteRead)
def azienda_corrente(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
):
    azienda = db.get(SysAzienda, ctx.azienda_id)
    return AziendaCorrenteRead(id=str(azienda.id), ragione_sociale=azienda.ragione_sociale)


# Cataloghi di riferimento per la gestione degli abbonamenti (consulente e
# super admin, vedi app/api/consulente.py e app/api/superadmin.py): dati non
# legati a un'azienda specifica, quindi richiedono solo un utente autenticato
# e non il contesto azienda di get_current_azienda.


@router.get("/certificazioni", response_model=list[CertificazioneCatalogoRead])
def elenco_certificazioni(
    db: Session = Depends(get_db),
    _utente: UtenteContext = Depends(get_current_user),
):
    certificazioni = db.scalars(
        select(CatCertificazione).where(CatCertificazione.attiva.is_(True)).order_by(CatCertificazione.nome)
    ).all()
    return [CertificazioneCatalogoRead(id=c.id, nome=c.nome, codice=c.codice) for c in certificazioni]


@router.get("/stati-certificazione", response_model=list[StatoCertificazioneRead])
def elenco_stati_certificazione(
    db: Session = Depends(get_db),
    _utente: UtenteContext = Depends(get_current_user),
):
    stati = db.scalars(
        select(CatStatoCertificazione).where(CatStatoCertificazione.attiva.is_(True)).order_by(CatStatoCertificazione.nome)
    ).all()
    return [StatoCertificazioneRead(id=s.id, nome=s.nome) for s in stati]
