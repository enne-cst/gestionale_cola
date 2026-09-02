"""Contratti dati per il riepilogo "Personale e occupazione" (Correzione
22): presentazione calcolata della rilevazione di "Addetti da visura" più
recente, sopra le tabelle già esistenti (`ana_addetti_visura*`,
`ana_addetti_comune*`) — non un nuovo dominio dati."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.schemas.registro_campi import VerificationStatus


class GruppoCalcolatoRead(BaseModel):
    """Un gruppo di percentuali esaustive (es. tempo determinato/indeterminato)
    con i "numeri di persone" derivati dal metodo dei maggiori resti (§
    punto 13). `numeri` resta a None per ogni categoria quando il gruppo non
    è completo o le percentuali non sono coerenti (§ punto 14): il frontend
    non deve mai presentare un numero derivato come certo in quei casi."""

    completo: bool
    coerente: bool
    messaggio: str | None = None
    percentuali: dict[str, Decimal | None]
    numeri: dict[str, int | None]


class DatiTerritorialiRead(BaseModel):
    comune: str | None = None
    provincia: str | None = None
    dipendenti_nel_comune: int | None = None
    indipendenti_nel_comune: int | None = None
    addetti_totali_nel_comune: int | None = None
    # Percentuali derivate a sola lettura (§ punto 19), mai salvate.
    percentuale_dipendenti_nel_comune: Decimal | None = None
    percentuale_indipendenti_nel_comune: Decimal | None = None


class PersonaleOccupazioneRiepilogoRead(BaseModel):
    rilevazione_id: UUID | None = None
    periodo_id: UUID | None = None
    fonte: str | None = None
    anno_riferimento: int | None = None
    periodo: str | None = None
    data_rilevazione: date | None = None
    addetti_totali: int | None = None
    dipendenti: int | None = None
    indipendenti: int | None = None
    collaboratori: int | None = None
    tipologia_contrattuale: GruppoCalcolatoRead
    orario_lavoro: GruppoCalcolatoRead
    inquadramento: GruppoCalcolatoRead
    territorio: DatiTerritorialiRead
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None
