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

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import UtenteContext, require_consulente
from app.core.security import hash_password
from app.database import get_db
from app.models.sistema import RelUtenteAzienda, SysAzienda, SysProfilo, SysUtente
from app.schemas.consulente import NuovaAziendaRequest, NuovaAziendaResponse

router = APIRouter(prefix="/api/consulente", tags=["Consulente"])


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
