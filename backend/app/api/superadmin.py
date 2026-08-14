"""Endpoint riservati al super admin (doc. cap. 2.2.7 "revoca degli
accessi"): approvare/bloccare le aziende, creare account consulente,
associare/rimuovere un consulente da un'azienda, disattivare/riattivare un
consulente."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import abbonamenti as abbonamenti_service
from app.core.deps import require_superadmin
from app.core.security import hash_password
from app.database import get_db
from app.models.sistema import RelUtenteAzienda, SysAzienda, SysProfilo, SysUtente
from app.schemas.abbonamenti import AbbonamentoRead, AbbonamentoUpsert
from app.schemas.superadmin import (
    AssociaConsulenteRequest,
    AziendaAmministrazioneRead,
    AziendaSintesi,
    ConsulenteAmministrazioneRead,
    ConsulenteRead,
    NuovoConsulenteRequest,
)

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


def _aziende_per_consulente(db: Session, consulente_ids: list[UUID]) -> dict[UUID, list[AziendaSintesi]]:
    """Direzione inversa di `_consulenti_per_azienda`: per ciascun
    consulente, le aziende clienti a cui è associato (relazione attiva)."""
    if not consulente_ids:
        return {}
    righe = db.execute(
        select(RelUtenteAzienda.utente_id, SysAzienda)
        .join(SysAzienda, RelUtenteAzienda.azienda_id == SysAzienda.id)
        .join(SysProfilo, RelUtenteAzienda.profilo_id == SysProfilo.id)
        .where(
            RelUtenteAzienda.utente_id.in_(consulente_ids),
            RelUtenteAzienda.attivo.is_(True),
            SysProfilo.codice == "CONSULENTE",
        )
        .order_by(SysAzienda.ragione_sociale)
    ).all()

    per_consulente: dict[UUID, list[AziendaSintesi]] = {}
    for utente_id, azienda in righe:
        per_consulente.setdefault(utente_id, []).append(
            AziendaSintesi(
                id=azienda.id, ragione_sociale=azienda.ragione_sociale, stato_approvazione=azienda.stato_approvazione
            )
        )
    return per_consulente


def _consulente_read(db: Session, utente: SysUtente) -> ConsulenteAmministrazioneRead:
    aziende = _aziende_per_consulente(db, [utente.id]).get(utente.id, [])
    return ConsulenteAmministrazioneRead(
        id=utente.id, nome=utente.nome, cognome=utente.cognome, email=utente.email, attivo=utente.attivo,
        aziende=aziende,
    )


@router.get("/consulenti", response_model=list[ConsulenteAmministrazioneRead])
def elenco_consulenti(db: Session = Depends(get_db)):
    consulenti = db.scalars(
        select(SysUtente)
        .join(RelUtenteAzienda, RelUtenteAzienda.utente_id == SysUtente.id)
        .join(SysProfilo, RelUtenteAzienda.profilo_id == SysProfilo.id)
        .where(SysProfilo.codice == "CONSULENTE", RelUtenteAzienda.attivo.is_(True))
        .distinct()
        .order_by(SysUtente.cognome, SysUtente.nome)
    ).all()
    aziende_per_consulente = _aziende_per_consulente(db, [c.id for c in consulenti])
    return [
        ConsulenteAmministrazioneRead(
            id=c.id, nome=c.nome, cognome=c.cognome, email=c.email, attivo=c.attivo,
            aziende=aziende_per_consulente.get(c.id, []),
        )
        for c in consulenti
    ]


@router.post("/consulenti", response_model=ConsulenteAmministrazioneRead, status_code=status.HTTP_201_CREATED)
def crea_consulente(payload: NuovoConsulenteRequest, db: Session = Depends(get_db)):
    if db.scalars(select(SysUtente).where(SysUtente.email == payload.email)).first() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email già registrata")

    profilo_consulente = db.scalars(select(SysProfilo).where(SysProfilo.codice == "CONSULENTE")).first()
    if profilo_consulente is None:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Profilo Consulente non configurato")

    # Operazione composita in un'unica transazione, stesso schema di
    # consulente.crea_azienda: l'utente e la sua relazione di profilo
    # nascono insieme o non nasce nessuno dei due.
    consulente = SysUtente(
        nome=payload.nome,
        cognome=payload.cognome,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(consulente)
    db.flush()

    # azienda_id None: riga di "identità" del consulente, non legata a un
    # cliente specifico (stesso pattern usato dal seed di sviluppo).
    db.add(RelUtenteAzienda(utente_id=consulente.id, azienda_id=None, profilo_id=profilo_consulente.id))
    db.commit()
    db.refresh(consulente)

    return _consulente_read(db, consulente)


def _consulente_o_404(db: Session, consulente_id: UUID) -> SysUtente:
    utente = db.get(SysUtente, consulente_id)
    if utente is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Consulente non trovato")
    return utente


@router.post("/consulenti/{consulente_id}/disattiva", response_model=ConsulenteAmministrazioneRead)
def disattiva_consulente(consulente_id: UUID, db: Session = Depends(get_db)):
    utente = _consulente_o_404(db, consulente_id)
    utente.attivo = False
    db.commit()
    db.refresh(utente)
    return _consulente_read(db, utente)


@router.post("/consulenti/{consulente_id}/attiva", response_model=ConsulenteAmministrazioneRead)
def attiva_consulente(consulente_id: UUID, db: Session = Depends(get_db)):
    utente = _consulente_o_404(db, consulente_id)
    utente.attivo = True
    db.commit()
    db.refresh(utente)
    return _consulente_read(db, utente)


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
        if associazione_esistente.attivo:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Il consulente è già associato a questa azienda")
        # Riattiva la riga esistente invece di crearne una nuova: il vincolo
        # UNIQUE(utente_id, azienda_id) ne impedirebbe comunque una seconda,
        # e un'associazione rimossa deve poter essere ricreata.
        associazione_esistente.attivo = True
        db.commit()
        return

    db.add(RelUtenteAzienda(utente_id=payload.consulente_id, azienda_id=azienda_id, profilo_id=profilo_consulente.id))
    db.commit()


@router.delete("/aziende/{azienda_id}/consulenti/{consulente_id}", status_code=status.HTTP_204_NO_CONTENT)
def rimuovi_associazione_consulente(azienda_id: UUID, consulente_id: UUID, db: Session = Depends(get_db)):
    relazione = db.scalars(
        select(RelUtenteAzienda).where(
            RelUtenteAzienda.utente_id == consulente_id,
            RelUtenteAzienda.azienda_id == azienda_id,
            RelUtenteAzienda.attivo.is_(True),
        )
    ).first()
    if relazione is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Associazione non trovata")
    # Soft-disattivazione (storicizzazione, non cancellazione): riattivabile
    # da associa_consulente sopra.
    relazione.attivo = False
    db.commit()


@router.get("/aziende/{azienda_id}/abbonamenti", response_model=list[AbbonamentoRead])
def elenco_abbonamenti_azienda(azienda_id: UUID, db: Session = Depends(get_db)):
    _azienda_o_404(db, azienda_id)
    return [abbonamenti_service.to_read(db, a) for a in abbonamenti_service.elenco_abbonamenti(db, azienda_id)]


@router.put("/aziende/{azienda_id}/abbonamenti/{certificazione_id}", response_model=AbbonamentoRead)
def aggiorna_abbonamento_azienda(
    azienda_id: UUID,
    certificazione_id: UUID,
    payload: AbbonamentoUpsert,
    db: Session = Depends(get_db),
):
    _azienda_o_404(db, azienda_id)
    abbonamento = abbonamenti_service.upsert_abbonamento(
        db,
        azienda_id=azienda_id,
        certificazione_id=certificazione_id,
        stato_codice=payload.stato_codice,
        data_attivazione=payload.data_attivazione,
        data_scadenza=payload.data_scadenza,
        rinnovo_automatico=payload.rinnovo_automatico,
    )
    return abbonamenti_service.to_read(db, abbonamento)


@router.post("/aziende/{azienda_id}/abbonamenti/{certificazione_id}/disattiva", response_model=AbbonamentoRead)
def disattiva_abbonamento_azienda(azienda_id: UUID, certificazione_id: UUID, db: Session = Depends(get_db)):
    _azienda_o_404(db, azienda_id)
    abbonamento = abbonamenti_service.disattiva_abbonamento(db, azienda_id=azienda_id, certificazione_id=certificazione_id)
    return abbonamenti_service.to_read(db, abbonamento)
