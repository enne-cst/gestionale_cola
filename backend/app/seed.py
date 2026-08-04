"""Seed dei dati di sviluppo: un'azienda (già approvata), il suo account
admin, un account consulente e un account super admin, tutti con
credenziali note a priori per poter testare subito il login (vedi
`session-log/` per le credenziali). Id fissi, idempotente: eseguibile ad
ogni avvio senza creare duplicati (`INSERT ... se non esiste già`).
Limitato all'ambiente di sviluppo (vedi `app/main.py`)."""

import uuid

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.sistema import RelUtenteAzienda, SysAzienda, SysProfilo, SysUtente

DEV_AZIENDA_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEV_UTENTE_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
DEV_CONSULENTE_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")
DEV_SUPERADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000004")

DEV_UTENTE_PASSWORD = "azienda123"
DEV_CONSULENTE_PASSWORD = "consulente123"
DEV_SUPERADMIN_PASSWORD = "superadmin123"


def run_seed(db: Session) -> None:
    azienda = db.get(SysAzienda, DEV_AZIENDA_ID)
    if azienda is None:
        azienda = SysAzienda(
            id=DEV_AZIENDA_ID,
            ragione_sociale="Azienda di Prova Srl",
            partita_iva="00000000000",
            email_registrazione="azienda-prova@example.test",
            # Approvata subito: è l'azienda di sviluppo, non deve passare
            # dal flusso di approvazione del super admin per essere usata.
            stato_approvazione="approvata",
        )
        db.add(azienda)
        db.flush()

    utente = db.get(SysUtente, DEV_UTENTE_ID)
    if utente is None:
        profilo_admin = db.query(SysProfilo).filter_by(codice="AZIENDA_ADMIN").first()
        utente = SysUtente(
            id=DEV_UTENTE_ID,
            nome="Prova",
            cognome="Azienda",
            email="utente-prova@example.test",
            password_hash=hash_password(DEV_UTENTE_PASSWORD),
        )
        db.add(utente)
        db.flush()

        if profilo_admin is not None:
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
                        profilo_id=profilo_admin.id,
                    )
                )

    consulente = db.get(SysUtente, DEV_CONSULENTE_ID)
    if consulente is None:
        profilo_consulente = db.query(SysProfilo).filter_by(codice="CONSULENTE").first()
        consulente = SysUtente(
            id=DEV_CONSULENTE_ID,
            nome="Prova",
            cognome="Consulente",
            email="consulente-prova@example.test",
            password_hash=hash_password(DEV_CONSULENTE_PASSWORD),
        )
        db.add(consulente)
        db.flush()

        if profilo_consulente is not None:
            relazione_esistente = (
                db.query(RelUtenteAzienda).filter_by(utente_id=consulente.id, profilo_id=profilo_consulente.id).first()
            )
            if relazione_esistente is None:
                # azienda_id volutamente None: il consulente non è legato a
                # una singola azienda (vedi migrazione 0005).
                db.add(
                    RelUtenteAzienda(
                        utente_id=consulente.id,
                        azienda_id=None,
                        profilo_id=profilo_consulente.id,
                    )
                )

    superadmin = db.get(SysUtente, DEV_SUPERADMIN_ID)
    if superadmin is None:
        profilo_superadmin = db.query(SysProfilo).filter_by(codice="SUPERADMIN").first()
        superadmin = SysUtente(
            id=DEV_SUPERADMIN_ID,
            nome="Prova",
            cognome="Superadmin",
            email="superadmin-prova@example.test",
            password_hash=hash_password(DEV_SUPERADMIN_PASSWORD),
        )
        db.add(superadmin)
        db.flush()

        if profilo_superadmin is not None:
            relazione_esistente = (
                db.query(RelUtenteAzienda).filter_by(utente_id=superadmin.id, profilo_id=profilo_superadmin.id).first()
            )
            if relazione_esistente is None:
                # azienda_id volutamente None, come per il consulente.
                db.add(
                    RelUtenteAzienda(
                        utente_id=superadmin.id,
                        azienda_id=None,
                        profilo_id=profilo_superadmin.id,
                    )
                )

    db.commit()
