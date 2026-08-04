"""Endpoint riservati al super admin. Per ora due sole responsabilità
(deliberatamente minime, doc. cap. 2.2.7 "revoca degli accessi"):
approvare le aziende create da un consulente, e associare un consulente a
un'azienda già esistente (che non ha ancora nessun consulente assegnato, o
a cui va aggiunto un secondo consulente)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_superadmin
from app.database import get_db
from app.models.sistema import RelUtenteAzienda, SysAzienda, SysProfilo, SysUtente
from app.schemas.superadmin import AssociaConsulenteRequest, AziendaAmministrazioneRead, ConsulenteRead

router = APIRouter(prefix="/api/superadmin", tags=["Super admin"], dependencies=[Depends(require_superadmin)])


def _consulenti_per_azienda(db: Session, azienda_ids: list[UUID]) -> dict[UUID, list[ConsulenteRead]]:
    """Consulenti attivi assegnati a ciascuna azienda: query separata (non
    una relazione ORM) perché rel_utenti_aziende collega utenti di profili
    diversi, non solo consulenti."""
    if not azienda_ids:
        return {}
    righe = db.execute(
        select(RelUtenteAzienda.azienda_id, SysUtente)
        .join(SysUtente, RelUtenteAzienda.utente_id == SysUtente.id)
        .join(SysProfilo, RelUtenteAzienda.profilo_id == SysProfilo.id)
        .where(
            RelUtenteAzienda.azienda_id.in_(azienda_ids),
            RelUtenteAzienda.attivo.is_(True),
            SysProfilo.codice == "CONSULENTE",
        )
        .order_by(RelUtenteAzienda.created_at)
    ).all()

    per_azienda: dict[UUID, list[ConsulenteRead]] = {}
    for azienda_id, utente in righe:
        per_azienda.setdefault(azienda_id, []).append(
            ConsulenteRead(id=utente.id, nome=utente.nome, cognome=utente.cognome, email=utente.email)
        )
    return per_azienda


def _to_read(azienda: SysAzienda, consulenti: list[ConsulenteRead]) -> AziendaAmministrazioneRead:
    return AziendaAmministrazioneRead(
        id=azienda.id,
        ragione_sociale=azienda.ragione_sociale,
        partita_iva=azienda.partita_iva,
        codice_fiscale=azienda.codice_fiscale,
        stato_approvazione=azienda.stato_approvazione,
        created_at=azienda.created_at,
        consulenti=consulenti,
    )


def _azienda_read(db: Session, azienda: SysAzienda) -> AziendaAmministrazioneRead:
    consulenti = _consulenti_per_azienda(db, [azienda.id]).get(azienda.id, [])
    return _to_read(azienda, consulenti)


@router.get("/aziende", response_model=list[AziendaAmministrazioneRead])
def elenco_aziende(db: Session = Depends(get_db)):
    aziende = db.scalars(select(SysAzienda).order_by(SysAzienda.created_at.desc())).all()
    consulenti_per_azienda = _consulenti_per_azienda(db, [a.id for a in aziende])
    return [_to_read(azienda, consulenti_per_azienda.get(azienda.id, [])) for azienda in aziende]


@router.get("/consulenti", response_model=list[ConsulenteRead])
def elenco_consulenti(db: Session = Depends(get_db)):
    return db.scalars(
        select(SysUtente)
        .join(RelUtenteAzienda, RelUtenteAzienda.utente_id == SysUtente.id)
        .join(SysProfilo, RelUtenteAzienda.profilo_id == SysProfilo.id)
        .where(SysProfilo.codice == "CONSULENTE", RelUtenteAzienda.attivo.is_(True))
        .distinct()
        .order_by(SysUtente.cognome, SysUtente.nome)
    ).all()


def _azienda_o_404(db: Session, azienda_id: UUID) -> SysAzienda:
    azienda = db.get(SysAzienda, azienda_id)
    if azienda is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Azienda non trovata")
    return azienda


@router.post("/aziende/{azienda_id}/approva", response_model=AziendaAmministrazioneRead)
def approva_azienda(azienda_id: UUID, db: Session = Depends(get_db)):
    azienda = _azienda_o_404(db, azienda_id)
    azienda.stato_approvazione = "approvata"
    db.commit()
    db.refresh(azienda)
    return _azienda_read(db, azienda)


@router.post("/aziende/{azienda_id}/rifiuta", response_model=AziendaAmministrazioneRead)
def rifiuta_azienda(azienda_id: UUID, db: Session = Depends(get_db)):
    azienda = _azienda_o_404(db, azienda_id)
    azienda.stato_approvazione = "rifiutata"
    db.commit()
    db.refresh(azienda)
    return _azienda_read(db, azienda)


@router.post("/aziende/{azienda_id}/consulenti", status_code=status.HTTP_201_CREATED)
def associa_consulente(
    azienda_id: UUID,
    payload: AssociaConsulenteRequest,
    db: Session = Depends(get_db),
):
    _azienda_o_404(db, azienda_id)

    profilo_consulente = db.scalars(select(SysProfilo).where(SysProfilo.codice == "CONSULENTE")).first()
    if profilo_consulente is None:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Profilo Consulente non configurato")

    relazione_consulente = db.scalars(
        select(RelUtenteAzienda).where(
            RelUtenteAzienda.utente_id == payload.consulente_id,
            RelUtenteAzienda.profilo_id == profilo_consulente.id,
            RelUtenteAzienda.attivo.is_(True),
        )
    ).first()
    if relazione_consulente is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "L'utente indicato non è un consulente attivo")

    associazione_esistente = db.scalars(
        select(RelUtenteAzienda).where(
            RelUtenteAzienda.utente_id == payload.consulente_id,
            RelUtenteAzienda.azienda_id == azienda_id,
        )
    ).first()
    if associazione_esistente is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Il consulente è già associato a questa azienda")

    db.add(RelUtenteAzienda(utente_id=payload.consulente_id, azienda_id=azienda_id, profilo_id=profilo_consulente.id))
    db.commit()
