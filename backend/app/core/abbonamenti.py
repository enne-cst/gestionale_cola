"""Servizio di gestione degli abbonamenti (certificazioni attive) di
un'azienda: attivazione, aggiornamento e disattivazione di
`sys_aziende_certificazioni`. Implementazione unica condivisa da
`app/api/consulente.py` e `app/api/superadmin.py`, i due soli ruoli
autorizzati a toccare questo dato (niente logica duplicata, doc. cap.
2.3.6-2.3.7).

Disattivare un abbonamento non cancella i dati applicativi già inseriti
nelle sezioni che sblocca: restano nel database, semplicemente
irraggiungibili finché l'abbonamento non torna attivo (vedi
`app/core/sezioni.py`)."""

from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sistema import CatCertificazione, CatStatoCertificazione, SysAziendaCertificazione
from app.schemas.abbonamenti import AbbonamentoRead

STATO_DISATTIVATA = "DISATTIVATA"


def _certificazione_o_404(db: Session, certificazione_id: UUID) -> CatCertificazione:
    certificazione = db.get(CatCertificazione, certificazione_id)
    if certificazione is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certificazione non trovata")
    return certificazione


def _stato_o_400(db: Session, stato_codice: str) -> CatStatoCertificazione:
    stato = db.scalars(select(CatStatoCertificazione).where(CatStatoCertificazione.nome == stato_codice)).first()
    if stato is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Stato certificazione '{stato_codice}' non valido")
    return stato


def to_read(db: Session, abbonamento: SysAziendaCertificazione) -> AbbonamentoRead:
    certificazione = db.get(CatCertificazione, abbonamento.certificazione_id)
    stato = db.get(CatStatoCertificazione, abbonamento.stato_id)
    return AbbonamentoRead(
        certificazione_id=abbonamento.certificazione_id,
        certificazione_nome=certificazione.nome,
        certificazione_codice=certificazione.codice,
        stato_codice=stato.nome,
        data_attivazione=abbonamento.data_attivazione,
        data_scadenza=abbonamento.data_scadenza,
        rinnovo_automatico=abbonamento.rinnovo_automatico,
        data_disattivazione=abbonamento.data_disattivazione,
        updated_at=abbonamento.updated_at,
    )


def elenco_abbonamenti(db: Session, azienda_id: UUID) -> list[SysAziendaCertificazione]:
    return list(
        db.scalars(
            select(SysAziendaCertificazione)
            .where(SysAziendaCertificazione.azienda_id == azienda_id)
            .order_by(SysAziendaCertificazione.created_at)
        )
    )


def _abbonamento_esistente(db: Session, azienda_id: UUID, certificazione_id: UUID) -> SysAziendaCertificazione | None:
    return db.scalars(
        select(SysAziendaCertificazione).where(
            SysAziendaCertificazione.azienda_id == azienda_id,
            SysAziendaCertificazione.certificazione_id == certificazione_id,
        )
    ).first()


def upsert_abbonamento(
    db: Session,
    *,
    azienda_id: UUID,
    certificazione_id: UUID,
    stato_codice: str,
    data_attivazione: date,
    data_scadenza: date,
    rinnovo_automatico: bool,
) -> SysAziendaCertificazione:
    _certificazione_o_404(db, certificazione_id)
    stato = _stato_o_400(db, stato_codice)

    if data_scadenza < data_attivazione:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La data di scadenza non può precedere l'attivazione")

    abbonamento = _abbonamento_esistente(db, azienda_id, certificazione_id)
    if abbonamento is None:
        abbonamento = SysAziendaCertificazione(azienda_id=azienda_id, certificazione_id=certificazione_id)
        db.add(abbonamento)

    abbonamento.stato_id = stato.id
    abbonamento.data_attivazione = data_attivazione
    abbonamento.data_scadenza = data_scadenza
    abbonamento.rinnovo_automatico = rinnovo_automatico
    # Impostare uno stato diverso da DISATTIVATA è una (ri)attivazione: azzera
    # l'eventuale disattivazione precedente invece di lasciarla come residuo
    # incoerente con lo stato corrente.
    if stato.nome != STATO_DISATTIVATA:
        abbonamento.data_disattivazione = None
        abbonamento.data_cancellazione_prevista = None

    db.commit()
    db.refresh(abbonamento)
    return abbonamento


def disattiva_abbonamento(db: Session, *, azienda_id: UUID, certificazione_id: UUID) -> SysAziendaCertificazione:
    abbonamento = _abbonamento_esistente(db, azienda_id, certificazione_id)
    if abbonamento is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nessun abbonamento per questa certificazione")

    stato_disattivata = _stato_o_400(db, STATO_DISATTIVATA)
    abbonamento.stato_id = stato_disattivata.id
    abbonamento.data_disattivazione = date.today()
    db.commit()
    db.refresh(abbonamento)
    return abbonamento
