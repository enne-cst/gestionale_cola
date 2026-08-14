"""Contratti dati (Pydantic) per le sezioni dell'Anagrafica Aziendale
soggette all'abbonamento ISO 9001. Stessa convenzione di
`app.schemas.anagrafica`: *Create* (campi inseribili, obbligatori del
database marcati come richiesti), *Update* (stessi campi, tutti opzionali:
il PUT/POST applica solo i campi effettivamente inviati) e *Read*
(Create/Update + id/azienda_id/timestamp)."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class _OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class _ReadMeta(_OrmModel):
    id: uuid.UUID
    azienda_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CatalogoRead(_OrmModel):
    id: uuid.UUID
    codice: str
    denominazione: str
    ordine_visualizzazione: int
    attivo: bool


# ===========================================================================
# Contratto di lavoro (singleton)
# ===========================================================================


class ContrattoLavoroUpsert(_OrmModel):
    ccnl_applicato: str
    settore_ccnl: str
    data_applicazione: date
    ccnl_precedente: str | None = None
    note: str | None = None


class ContrattoLavoroRead(ContrattoLavoroUpsert, _ReadMeta):
    pass


# ===========================================================================
# Posizioni assicurative e previdenziali (singleton)
# ===========================================================================


class PosizioniAssicurativePrevidenzialiUpsert(_OrmModel):
    numero_posizione_inps: str
    sede_territoriale_inps: str
    numero_posizione_inail: str
    sede_territoriale_inail: str


class PosizioniAssicurativePrevidenzialiRead(PosizioniAssicurativePrevidenzialiUpsert, _ReadMeta):
    pass


# ===========================================================================
# Fondo interprofessionale (elenco)
# ===========================================================================


class FondoInterprofessionaleCreate(_OrmModel):
    fondo_interprofessionale: str
    stato_iscrizione_id: uuid.UUID
    data_adesione: date
    codice_fondo: str | None = None
    data_recesso: date | None = None
    note: str | None = None


class FondoInterprofessionaleUpdate(_OrmModel):
    fondo_interprofessionale: str | None = None
    stato_iscrizione_id: uuid.UUID | None = None
    data_adesione: date | None = None
    codice_fondo: str | None = None
    data_recesso: date | None = None
    note: str | None = None


class FondoInterprofessionaleRead(FondoInterprofessionaleCreate, _ReadMeta):
    pass


# ===========================================================================
# Dati generali (elenco, una riga per anno)
# ===========================================================================


class DatiGeneraliCreate(_OrmModel):
    anno_riferimento: int
    numero_addetti: int
    numero_dipendenti: int
    numero_soci_lavoratori: int
    organico_medio_annuo: Decimal
    eta_media: Decimal


class DatiGeneraliUpdate(_OrmModel):
    anno_riferimento: int | None = None
    numero_addetti: int | None = None
    numero_dipendenti: int | None = None
    numero_soci_lavoratori: int | None = None
    organico_medio_annuo: Decimal | None = None
    eta_media: Decimal | None = None


class DatiGeneraliRead(DatiGeneraliCreate, _ReadMeta):
    pass


# ===========================================================================
# Ripartizione organico (elenco, una riga per anno) + percentuali da vista
# ===========================================================================


class RipartizioneOrganicoCreate(_OrmModel):
    anno_riferimento: int
    numero_amministrativi: int
    numero_project_manager: int
    numero_tecnici: int
    numero_preposti: int
    numero_operativi: int
    numero_dirigenti_sicurezza: int
    numero_uomini: int
    numero_donne: int
    numero_italiani: int
    numero_stranieri: int
    numero_tempo_determinato: int
    numero_tempo_indeterminato: int
    numero_laureati: int
    numero_diplomati: int


class RipartizioneOrganicoUpdate(_OrmModel):
    anno_riferimento: int | None = None
    numero_amministrativi: int | None = None
    numero_project_manager: int | None = None
    numero_tecnici: int | None = None
    numero_preposti: int | None = None
    numero_operativi: int | None = None
    numero_dirigenti_sicurezza: int | None = None
    numero_uomini: int | None = None
    numero_donne: int | None = None
    numero_italiani: int | None = None
    numero_stranieri: int | None = None
    numero_tempo_determinato: int | None = None
    numero_tempo_indeterminato: int | None = None
    numero_laureati: int | None = None
    numero_diplomati: int | None = None


class RipartizioneOrganicoRead(RipartizioneOrganicoCreate, _ReadMeta):
    percentuale_amministrativi: Decimal | None = None
    percentuale_project_manager: Decimal | None = None
    percentuale_tecnici: Decimal | None = None
    percentuale_preposti: Decimal | None = None
    percentuale_operativi: Decimal | None = None
    percentuale_dirigenti_sicurezza: Decimal | None = None
    percentuale_uomini: Decimal | None = None
    percentuale_donne: Decimal | None = None
    percentuale_italiani: Decimal | None = None
    percentuale_stranieri: Decimal | None = None
    percentuale_tempo_determinato: Decimal | None = None
    percentuale_tempo_indeterminato: Decimal | None = None
    percentuale_laureati: Decimal | None = None
    percentuale_diplomati: Decimal | None = None


# ===========================================================================
# Turni di lavoro (singleton)
# ===========================================================================


class TurniLavoroUpsert(_OrmModel):
    presenza_turnazioni: bool
    tipologia_turno: str | None = None
    numero_turni: int | None = None
    fasce_orarie: str | None = None
    rotazione_turni: str | None = None
    lavoro_notturno: bool
    lavoro_festivo: bool
    lavoro_ciclo_continuo: bool
    note: str | None = None


class TurniLavoroRead(TurniLavoroUpsert, _ReadMeta):
    pass


# ===========================================================================
# Outsourcing (elenco)
# ===========================================================================


class OutsourcingCreate(_OrmModel):
    processo_attivita_affidata: str
    data_inizio: date
    data_fine: date | None = None
    stato_id: uuid.UUID
    referente_interno: str
    contratto_associato: str
    note: str | None = None


class OutsourcingUpdate(_OrmModel):
    processo_attivita_affidata: str | None = None
    data_inizio: date | None = None
    data_fine: date | None = None
    stato_id: uuid.UUID | None = None
    referente_interno: str | None = None
    contratto_associato: str | None = None
    note: str | None = None


class OutsourcingRead(OutsourcingCreate, _ReadMeta):
    pass


# ===========================================================================
# Subappaltatori (elenco)
# ===========================================================================


class SubappaltatoreCreate(_OrmModel):
    ragione_sociale: str
    codice_fiscale_partita_iva: str
    categoria_lavori: str
    data_inizio: date
    data_fine: date | None = None
    stato_id: uuid.UUID
    referente: str
    documentazione_associata: str | None = None
    note: str | None = None


class SubappaltatoreUpdate(_OrmModel):
    ragione_sociale: str | None = None
    codice_fiscale_partita_iva: str | None = None
    categoria_lavori: str | None = None
    data_inizio: date | None = None
    data_fine: date | None = None
    stato_id: uuid.UUID | None = None
    referente: str | None = None
    documentazione_associata: str | None = None
    note: str | None = None


class SubappaltatoreRead(SubappaltatoreCreate, _ReadMeta):
    pass


# ===========================================================================
# Fornitori di materiali (elenco)
# ===========================================================================


class FornitoreMaterialiCreate(_OrmModel):
    ragione_sociale: str
    referente: str
    telefono: str
    email: str
    categoria_merceologica: str
    materiali_forniti: str
    data_inizio_collaborazione: date
    stato_id: uuid.UUID
    contratto: str | None = None
    certificazioni: str | None = None
    schede_tecniche_sicurezza: str | None = None
    altri_documenti: str | None = None


class FornitoreMaterialiUpdate(_OrmModel):
    ragione_sociale: str | None = None
    referente: str | None = None
    telefono: str | None = None
    email: str | None = None
    categoria_merceologica: str | None = None
    materiali_forniti: str | None = None
    data_inizio_collaborazione: date | None = None
    stato_id: uuid.UUID | None = None
    contratto: str | None = None
    certificazioni: str | None = None
    schede_tecniche_sicurezza: str | None = None
    altri_documenti: str | None = None


class FornitoreMaterialiRead(FornitoreMaterialiCreate, _ReadMeta):
    pass


# ===========================================================================
# Lavoratori autonomi (elenco)
# ===========================================================================


class LavoratoreAutonomoCreate(_OrmModel):
    nominativo_ragione_sociale: str
    codice_fiscale_partita_iva: str
    mansione: str
    attivita_svolta: str
    data_inizio_collaborazione: date
    data_fine_collaborazione: date | None = None
    stato_id: uuid.UUID
    documentazione_associata: str | None = None
    note: str | None = None


class LavoratoreAutonomoUpdate(_OrmModel):
    nominativo_ragione_sociale: str | None = None
    codice_fiscale_partita_iva: str | None = None
    mansione: str | None = None
    attivita_svolta: str | None = None
    data_inizio_collaborazione: date | None = None
    data_fine_collaborazione: date | None = None
    stato_id: uuid.UUID | None = None
    documentazione_associata: str | None = None
    note: str | None = None


class LavoratoreAutonomoRead(LavoratoreAutonomoCreate, _ReadMeta):
    pass


# ===========================================================================
# Indicatori economici (elenco, una riga per anno) + scostamento da vista
# ===========================================================================


class IndicatoreEconomicoCreate(_OrmModel):
    anno_riferimento: int
    fatturato: Decimal
    obiettivo: Decimal
    note: str | None = None


class IndicatoreEconomicoUpdate(_OrmModel):
    anno_riferimento: int | None = None
    fatturato: Decimal | None = None
    obiettivo: Decimal | None = None
    note: str | None = None


class IndicatoreEconomicoRead(IndicatoreEconomicoCreate, _ReadMeta):
    scostamento: Decimal | None = None


# ===========================================================================
# Variazioni organico (elenco, una riga per anno) + calcoli da vista
# ===========================================================================


class VariazioneOrganicoCreate(_OrmModel):
    anno_riferimento: int
    numero_nuove_assunzioni: int
    numero_cessazioni: int
    obiettivo_variazione_percentuale: Decimal
    note: str | None = None


class VariazioneOrganicoUpdate(_OrmModel):
    anno_riferimento: int | None = None
    numero_nuove_assunzioni: int | None = None
    numero_cessazioni: int | None = None
    obiettivo_variazione_percentuale: Decimal | None = None
    note: str | None = None


class VariazioneOrganicoRead(VariazioneOrganicoCreate, _ReadMeta):
    organico_medio_annuo: Decimal | None = None
    incremento_decremento_personale_percentuale: Decimal | None = None
    scostamento: Decimal | None = None


# ===========================================================================
# Assicurazioni (elenco)
# ===========================================================================


class AssicurazioneCreate(_OrmModel):
    tipologia_polizza: str
    compagnia_assicurativa: str
    numero_polizza: str
    data_emissione: date
    data_decorrenza: date
    data_scadenza: date
    massimale: Decimal
    stato_id: uuid.UUID
    contraente: str
    referente: str
    premio_assicurativo: Decimal
    frequenza_rinnovo_id: uuid.UUID
    documentazione_associata: str | None = None
    note: str | None = None


class AssicurazioneUpdate(_OrmModel):
    tipologia_polizza: str | None = None
    compagnia_assicurativa: str | None = None
    numero_polizza: str | None = None
    data_emissione: date | None = None
    data_decorrenza: date | None = None
    data_scadenza: date | None = None
    massimale: Decimal | None = None
    stato_id: uuid.UUID | None = None
    contraente: str | None = None
    referente: str | None = None
    premio_assicurativo: Decimal | None = None
    frequenza_rinnovo_id: uuid.UUID | None = None
    documentazione_associata: str | None = None
    note: str | None = None


class AssicurazioneRead(AssicurazioneCreate, _ReadMeta):
    pass


# ===========================================================================
# Contratti di rete: presenza (singleton) + contratti (elenco)
# ===========================================================================


class ContrattiRetePresenzaUpsert(_OrmModel):
    presenza: bool = False


class ContrattiRetePresenzaRead(ContrattiRetePresenzaUpsert, _ReadMeta):
    pass


class ContrattoReteCreate(_OrmModel):
    numero_registrazione: str
    numero_repertorio: str
    nome_contratto: str
    data_adesione: date
    data_cessazione: date | None = None
    note: str | None = None
    documentazione_associata: str | None = None


class ContrattoReteUpdate(_OrmModel):
    numero_registrazione: str | None = None
    numero_repertorio: str | None = None
    nome_contratto: str | None = None
    data_adesione: date | None = None
    data_cessazione: date | None = None
    note: str | None = None
    documentazione_associata: str | None = None


class ContrattoReteRead(ContrattoReteCreate, _ReadMeta):
    pass


# ===========================================================================
# Compliance e trasparenza (elenco)
# ===========================================================================


class ComplianceTrasparenzaCreate(_OrmModel):
    elemento: str
    presenza: bool = False
    data_adozione: date | None = None
    dettagli_note: str | None = None
    documentazione_associata: str | None = None


class ComplianceTrasparenzaUpdate(_OrmModel):
    elemento: str | None = None
    presenza: bool | None = None
    data_adozione: date | None = None
    dettagli_note: str | None = None
    documentazione_associata: str | None = None


class ComplianceTrasparenzaRead(ComplianceTrasparenzaCreate, _ReadMeta):
    pass


# ===========================================================================
# Procedimenti legali (elenco)
# ===========================================================================


class ProcedimentoLegaleCreate(_OrmModel):
    tipologia_procedimento: str
    controparte: str
    data_inizio: date
    data_conclusione: date | None = None
    stato_id: uuid.UUID
    esito: str | None = None
    note: str | None = None
    documentazione_associata: str | None = None


class ProcedimentoLegaleUpdate(_OrmModel):
    tipologia_procedimento: str | None = None
    controparte: str | None = None
    data_inizio: date | None = None
    data_conclusione: date | None = None
    stato_id: uuid.UUID | None = None
    esito: str | None = None
    note: str | None = None
    documentazione_associata: str | None = None


class ProcedimentoLegaleRead(ProcedimentoLegaleCreate, _ReadMeta):
    pass


# ===========================================================================
# Visite enti di controllo (elenco)
# ===========================================================================


class VisitaEnteControlloCreate(_OrmModel):
    ente: str
    tipologia_visita: str
    data_visita: date
    esito: str
    prescrizioni: str | None = None
    verbale_documentazione: str | None = None
    note: str | None = None


class VisitaEnteControlloUpdate(_OrmModel):
    ente: str | None = None
    tipologia_visita: str | None = None
    data_visita: date | None = None
    esito: str | None = None
    prescrizioni: str | None = None
    verbale_documentazione: str | None = None
    note: str | None = None


class VisitaEnteControlloRead(VisitaEnteControlloCreate, _ReadMeta):
    pass
