"""Endpoint riservati al consulente: creazione di nuove aziende clienti e
del relativo account di accesso.

Per ora ogni azienda ha un solo account (profilo Admin aziendale): questa è
una regola applicativa, non un vincolo di schema (vedi `deps.py`), pensata
per allentarsi quando servirà davvero il multi-utente per azienda.

L'azienda creata resta 'in_attesa' finché un super admin non la approva
(vedi `app/api/superadmin.py`): l'account admin aziendale non può accedere
prima di allora (vedi `app/api/auth.py`). Il consulente che la crea viene
comunque associato subito, così la ritrova già collegata a sé una volta
approvata."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import abbonamenti as abbonamenti_service
from app.core.deps import UtenteContext, require_consulente
from app.core.security import hash_password
from app.database import get_db
from app.models.sistema import RelUtenteAzienda, SysAzienda, SysProfilo, SysUtente
from app.schemas.abbonamenti import AbbonamentoRead, AbbonamentoUpsert
from app.schemas.consulente import AziendaClienteRead, NuovaAziendaRequest, NuovaAziendaResponse

router = APIRouter(prefix="/api/consulente", tags=["Consulente"])


def _azienda_del_consulente_o_403(db: Session, utente_id: UUID, azienda_id: UUID) -> SysAzienda:
    """Verifica che l'azienda sia effettivamente cliente del consulente
    corrente prima di lasciarlo operare sul suo abbonamento — stessa
    verifica su `rel_utenti_aziende` usata da `get_current_azienda` per il
    contesto "azienda attiva" (mai fidarsi di un id ricevuto dal client senza
    controllarne l'autorizzazione, doc. cap. 2.3.12)."""
    relazione = db.scalars(
        select(RelUtenteAzienda)
        .join(SysProfilo, RelUtenteAzienda.profilo_id == SysProfilo.id)
        .where(
            RelUtenteAzienda.utente_id == utente_id,
            RelUtenteAzienda.azienda_id == azienda_id,
            RelUtenteAzienda.attivo.is_(True),
            SysProfilo.codice == "CONSULENTE",
        )
    ).first()
    if relazione is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Nessun accesso a questa azienda")

    azienda = db.get(SysAzienda, azienda_id)
    if azienda is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Azienda non trovata")
    return azienda


@router.get("/aziende", response_model=list[AziendaClienteRead])
def elenco_aziende(db: Session = Depends(get_db), utente: UtenteContext = Depends(require_consulente)):
    """Aziende clienti associate al consulente, incluse quelle non ancora
    approvate (l'interfaccia le mostra ma non permette di entrarci: solo
    get_current_azienda decide chi può operare davvero, qui è solo un
    elenco)."""
    aziende = db.scalars(
        select(SysAzienda)
        .join(RelUtenteAzienda, RelUtenteAzienda.azienda_id == SysAzienda.id)
        .join(SysProfilo, RelUtenteAzienda.profilo_id == SysProfilo.id)
        .where(
            RelUtenteAzienda.utente_id == utente.utente_id,
            RelUtenteAzienda.attivo.is_(True),
            SysProfilo.codice == "CONSULENTE",
        )
        .order_by(SysAzienda.ragione_sociale)
    ).all()
    return [
        AziendaClienteRead(id=a.id, ragione_sociale=a.ragione_sociale, stato_approvazione=a.stato_approvazione)
        for a in aziende
    ]


@router.post("/aziende", response_model=NuovaAziendaResponse, status_code=status.HTTP_201_CREATED)
def crea_azienda(
    payload: NuovaAziendaRequest,
    db: Session = Depends(get_db),
    utente: UtenteContext = Depends(require_consulente),
):
    if not payload.partita_iva and not payload.codice_fiscale:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Indicare almeno partita IVA o codice fiscale")

    if db.scalars(select(SysUtente).where(SysUtente.email == payload.email)).first() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email già registrata")

    profilo_admin = db.scalars(select(SysProfilo).where(SysProfilo.codice == "AZIENDA_ADMIN")).first()
    profilo_consulente = db.scalars(select(SysProfilo).where(SysProfilo.codice == "CONSULENTE")).first()
    if profilo_admin is None or profilo_consulente is None:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Profili di sistema non configurati")

    # Operazione composita in un'unica transazione: azienda, utente e le
    # due relazioni (admin aziendale + consulente creatore) nascono
    # insieme o non nasce nessuno di essi. stato_approvazione parte da
    # 'in_attesa' (default a livello di colonna).
    azienda = SysAzienda(
        ragione_sociale=payload.ragione_sociale,
        partita_iva=payload.partita_iva,
        codice_fiscale=payload.codice_fiscale,
        email_registrazione=payload.email,
    )
    db.add(azienda)
    db.flush()

    admin_azienda = SysUtente(
        nome=payload.nome_referente,
        cognome=payload.cognome_referente,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(admin_azienda)
    db.flush()

    db.add(RelUtenteAzienda(utente_id=admin_azienda.id, azienda_id=azienda.id, profilo_id=profilo_admin.id))
    db.add(RelUtenteAzienda(utente_id=utente.utente_id, azienda_id=azienda.id, profilo_id=profilo_consulente.id))
    db.commit()
    db.refresh(azienda)

    return NuovaAziendaResponse(id=azienda.id, ragione_sociale=azienda.ragione_sociale, email=admin_azienda.email)


@router.get("/aziende/{azienda_id}", response_model=AziendaClienteRead)
def dettaglio_azienda(
    azienda_id: UUID,
    db: Session = Depends(get_db),
    utente: UtenteContext = Depends(require_consulente),
):
    azienda = _azienda_del_consulente_o_403(db, utente.utente_id, azienda_id)
    return AziendaClienteRead(id=azienda.id, ragione_sociale=azienda.ragione_sociale, stato_approvazione=azienda.stato_approvazione)


@router.get("/aziende/{azienda_id}/abbonamenti", response_model=list[AbbonamentoRead])
def elenco_abbonamenti_azienda(
    azienda_id: UUID,
    db: Session = Depends(get_db),
    utente: UtenteContext = Depends(require_consulente),
):
    _azienda_del_consulente_o_403(db, utente.utente_id, azienda_id)
    return [abbonamenti_service.to_read(db, a) for a in abbonamenti_service.elenco_abbonamenti(db, azienda_id)]


@router.put("/aziende/{azienda_id}/abbonamenti/{certificazione_id}", response_model=AbbonamentoRead)
def aggiorna_abbonamento_azienda(
    azienda_id: UUID,
    certificazione_id: UUID,
    payload: AbbonamentoUpsert,
    db: Session = Depends(get_db),
    utente: UtenteContext = Depends(require_consulente),
):
    _azienda_del_consulente_o_403(db, utente.utente_id, azienda_id)
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
def disattiva_abbonamento_azienda(
    azienda_id: UUID,
    certificazione_id: UUID,
    db: Session = Depends(get_db),
    utente: UtenteContext = Depends(require_consulente),
):
    _azienda_del_consulente_o_403(db, utente.utente_id, azienda_id)
    abbonamento = abbonamenti_service.disattiva_abbonamento(db, azienda_id=azienda_id, certificazione_id=certificazione_id)
    return abbonamenti_service.to_read(db, abbonamento)
