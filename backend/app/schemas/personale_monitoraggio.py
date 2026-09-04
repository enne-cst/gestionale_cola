"""Schemas della scheda "Monitoraggio personale" (cruscotto di sola lettura
derivato dalle schede delle persone — nessun dato autonomo, nessuna
scrittura). Aggrega Formazione e abilitazioni, Idoneità sanitaria, Ruoli,
Documenti personali e Attività pianificate; esclude esplicitamente
Conoscenza/Competenza/Consapevolezza, Titoli di studio, Esperienze e Note.
"""

import uuid
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.personale_hr import CatalogoRead


class _OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Stato di una singola cella della matrice (§6/§11): priorità Scaduto >
# In scadenza > Incompleto > Pianificato > Valido > Nessun dato.
StatoCellaMonitoraggio = Literal[
    "VALIDO", "IN_SCADENZA", "SCADUTO", "INCOMPLETO", "PIANIFICATO", "NESSUN_DATO"
]

# Classificazione complessiva della persona (§8): priorità Da gestire >
# In attenzione > Nessun dato > Regolare.
StatoComplessivoPersona = Literal["REGOLARE", "IN_ATTENZIONE", "DA_GESTIRE", "NESSUN_DATO"]


class CellaMonitoraggioRead(_OrmModel):
    stato: StatoCellaMonitoraggio
    etichetta: str
    dettaglio: str


class IndicatoriMonitoraggioRead(_OrmModel):
    """Sei indicatori superiori (§5): conteggi di singoli record, non di
    persone (eccetto "Persone attive")."""

    persone_attive: int
    registrazioni_valide: int
    in_scadenza: int
    scadute: int
    registrazioni_incomplete: int
    attivita_pianificate: int
    calcolato_al: date


class DistribuzioneConformitaRead(_OrmModel):
    regolari: int
    in_attenzione: int
    da_gestire: int
    nessun_dato: int


class ConformitaComplessivaRead(_OrmModel):
    """Conformità complessiva del personale (§7): conteggio di persone, mai
    di record."""

    percentuale_regolari: float
    persone_regolari: int
    totale_persone_attive: int
    distribuzione: DistribuzioneConformitaRead


class RiepilogoMonitoraggioRead(_OrmModel):
    indicatori: IndicatoriMonitoraggioRead
    conformita: ConformitaComplessivaRead


class MonitoraggioRigaRead(_OrmModel):
    """Una riga del Quadro generale del personale (§10): ogni cella
    sintetizza tutti i record attivi della categoria (§11), non li elenca."""

    persona_id: uuid.UUID
    nome: str
    cognome: str
    mansione: CatalogoRead | None
    reparto: CatalogoRead | None
    formazione: CellaMonitoraggioRead
    idoneita: CellaMonitoraggioRead
    ruoli: CellaMonitoraggioRead
    documenti: CellaMonitoraggioRead
    prossima_data: date | None
    prossima_data_origine: str | None
    stato_complessivo: StatoComplessivoPersona


class PaginaMonitoraggioRead(_OrmModel):
    items: list[MonitoraggioRigaRead]
    total: int
    page: int
    page_size: int
