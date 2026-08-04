"""Seed dei dati di sviluppo.

TEMPORANEO: finché non esiste un sistema di login reale (vedi
app/core/deps.py), il backend lavora sempre con un'azienda e un utente
fittizi, con id fissi noti a priori. Idempotente: eseguibile ad ogni avvio
senza creare duplicati (`INSERT ... se non esiste già`).
"""

import uuid

from sqlalchemy.orm import Session

from app.models.sistema import RelUtenteAzienda, SysAzienda, SysProfilo, SysUtente

DEV_AZIENDA_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEV_UTENTE_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")


def run_seed(db: Session) -> None:
    azienda = db.get(SysAzienda, DEV_AZIENDA_ID)
    if azienda is None:
        azienda = SysAzienda(
            id=DEV_AZIENDA_ID,
            ragione_sociale="Azienda di Prova Srl",
            partita_iva="00000000000",
            email_registrazione="azienda-prova@example.test",
        )
        db.add(azienda)
        db.flush()

    utente = db.get(SysUtente, DEV_UTENTE_ID)
    if utente is None:
        profilo = db.query(SysProfilo).filter_by(codice="AZIENDA_ADMIN").first()
        utente = SysUtente(
            id=DEV_UTENTE_ID,
            nome="Prova",
            cognome="Azienda",
            email="utente-prova@example.test",
            password_hash="nessun-login-attivo-vedi-app.core.deps",
        )
        db.add(utente)
        db.flush()

        if profilo is not None:
            relazione_esistente = (
                db.query(RelUtenteAzienda)
                .filter_by(utente_id=utente.id, azienda_id=azienda.id)
                .first()
            )
            if relazione_esistente is None:
                db.add(
                    RelUtenteAzienda(
                        utente_id=utente.id,
                        azienda_id=azienda.id,
                        profilo_id=profilo.id,
                    )
                )

    db.commit()
