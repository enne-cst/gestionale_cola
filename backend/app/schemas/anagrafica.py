"""Contratti dati (Pydantic) per il modulo Anagrafica Aziendale.

Per ogni entità: *Create* (campi inseribili, con gli obbligatori del
database marcati come richiesti), *Update* (stessi campi, tutti opzionali:
il PUT applica solo i campi effettivamente inviati) e *Read* (Create/Update
+ id/azienda_id/timestamp, popolato dal modello ORM).
"""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict

PeriodoRilevazione = Literal[
    "PRIMO_TRIMESTRE", "SECONDO_TRIMESTRE", "TERZO_TRIMESTRE", "QUARTO_TRIMESTRE", "MEDIA"
]
TipoSoggetto = Literal["PERSONA", "ORGANIZZAZIONE"]


class _OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class _ReadMeta(_OrmModel):
    id: uuid.UUID
    azienda_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# ===========================================================================
# Identificazione camerale (singleton)
# ===========================================================================


class IdentificazioneCameraleUpsert(_OrmModel):
    ragione_sociale: str | None = None
    forma_giuridica: str | None = None
    codice_fiscale: str | None = None
    partita_iva: str | None = None
    camera_commercio_competente: str | None = None
    ufficio_registro_imprese: str | None = None
    numero_rea: str | None = None
    provincia_rea: str | None = None
    stato_attivita: str | None = None
    data_atto_costitutivo: date | None = None
    data_inizio_attivita: date | None = None
    data_ultimo_protocollo: date | None = None


class IdentificazioneCameraleRead(IdentificazioneCameraleUpsert, _ReadMeta):
    pass


# ===========================================================================
# Iscrizioni registro imprese (multipla)
# ===========================================================================


class IscrizioneRegistroImpreseCreate(_OrmModel):
    tipo_iscrizione: str | None = None
    sezione: str | None = None
    data_iscrizione: date | None = None


class IscrizioneRegistroImpreseUpdate(IscrizioneRegistroImpreseCreate):
    pass


class IscrizioneRegistroImpreseRead(IscrizioneRegistroImpreseCreate, _ReadMeta):
    pass


# ===========================================================================
# Durata società ed esercizi (singleton)
# ===========================================================================


class DurataSocietaEserciziUpsert(_OrmModel):
    data_termine_societa: date | None = None
    scadenza_primo_esercizio: date | None = None
    scadenza_esercizi_successivi: str | None = None


class DurataSocietaEserciziRead(DurataSocietaEserciziUpsert, _ReadMeta):
    pass


# ===========================================================================
# Attività esercitata (singleton)
# ===========================================================================


class AttivitaEsercitataUpsert(_OrmModel):
    descrizione_attivita_esercitata: str | None = None
    data_decorrenza_attivita: date | None = None
    presenza_attivita_import_export: bool | None = None


class AttivitaEsercitataRead(AttivitaEsercitataUpsert, _ReadMeta):
    pass


# ===========================================================================
# Codici ATECO (multipla)
# ===========================================================================


class CodiceAtecoCreate(_OrmModel):
    codice: str
    descrizione: str | None = None
    classificazione: str | None = None
    ruolo_codice: str | None = None
    origine_codice: str | None = None
    fonte: str | None = None
    codice_nace: str | None = None


class CodiceAtecoUpdate(_OrmModel):
    codice: str | None = None
    descrizione: str | None = None
    classificazione: str | None = None
    ruolo_codice: str | None = None
    origine_codice: str | None = None
    fonte: str | None = None
    codice_nace: str | None = None


class CodiceAtecoRead(CodiceAtecoCreate, _ReadMeta):
    pass


# ===========================================================================
# Capitale sociale (singleton)
# ===========================================================================


class CapitaleSocialeUpsert(_OrmModel):
    valuta: str | None = None
    capitale_deliberato: Decimal | None = None
    capitale_sottoscritto: Decimal | None = None
    capitale_versato: Decimal | None = None


class CapitaleSocialeRead(CapitaleSocialeUpsert, _ReadMeta):
    pass


# ===========================================================================
# Amministrazione e controllo (singleton) + sistemi di amministrazione
# ===========================================================================


class SistemaAmministrazioneIn(_OrmModel):
    sistema_amministrazione: str


class SistemaAmministrazioneRead(_OrmModel):
    id: uuid.UUID
    sistema_amministrazione: str


class AmministrazioneControlloUpsert(_OrmModel):
    organo_amministrativo_in_carica: str | None = None
    numero_minimo_amministratori: int | None = None
    numero_amministratori_in_carica: int | None = None
    durata_in_carica_organo: str | None = None
    numero_sindaci_organi_controllo: int | None = None
    numero_titolari_cariche: int | None = None
    sistemi_amministrazione: list[SistemaAmministrazioneIn] | None = None
    """Elenco dei sistemi di amministrazione (es. 'Consiglio di Amministrazione',
    'Amministratore Unico'). Se presente in una PUT, sostituisce l'elenco
    esistente; se omesso, l'elenco esistente non viene toccato."""


class AmministrazioneControlloRead(_ReadMeta):
    organo_amministrativo_in_carica: str | None = None
    numero_minimo_amministratori: int | None = None
    numero_amministratori_in_carica: int | None = None
    durata_in_carica_organo: str | None = None
    numero_sindaci_organi_controllo: int | None = None
    numero_titolari_cariche: int | None = None
    sistemi_amministrazione: list[SistemaAmministrazioneRead] = []


# ===========================================================================
# Soci (multipla) + dati generali elenco soci (singleton)
# ===========================================================================


class SocioCreate(_OrmModel):
    persona_id: uuid.UUID | None = None
    tipo_soggetto: TipoSoggetto
    denominazione_organizzazione: str | None = None
    codice_fiscale_organizzazione: str | None = None
    comune_domicilio: str | None = None
    provincia_domicilio: str | None = None
    indirizzo_domicilio: str | None = None
    cap_domicilio: str | None = None
    tipo_diritto: str | None = None
    quota_nominale: Decimal | None = None
    quota_versata: Decimal | None = None
    percentuale_partecipazione: Decimal | None = None


class SocioUpdate(_OrmModel):
    persona_id: uuid.UUID | None = None
    tipo_soggetto: TipoSoggetto | None = None
    denominazione_organizzazione: str | None = None
    codice_fiscale_organizzazione: str | None = None
    comune_domicilio: str | None = None
    provincia_domicilio: str | None = None
    indirizzo_domicilio: str | None = None
    cap_domicilio: str | None = None
    tipo_diritto: str | None = None
    quota_nominale: Decimal | None = None
    quota_versata: Decimal | None = None
    percentuale_partecipazione: Decimal | None = None


class SocioRead(SocioCreate, _ReadMeta):
    pass


class ElencoSociUpsert(_OrmModel):
    numero_soci: int | None = None
    data_riferimento: date | None = None
    numero_complessivo_soci: int | None = None
    capitale_sociale_dichiarato: Decimal | None = None
    valuta: str | None = None
    data_deposito_pratica: date | None = None
    data_protocollo: date | None = None
    numero_protocollo: str | None = None


class ElencoSociRead(ElencoSociUpsert, _ReadMeta):
    pass


# ===========================================================================
# Amministratori e cariche (multipla)
# ===========================================================================


class AmministratoreCaricaCreate(_OrmModel):
    persona_id: uuid.UUID
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    delega_presente: bool | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_attribuiti: str | None = None
    limitazioni_poteri: str | None = None
    legale_rappresentante: bool = False
    modalita_firma: str | None = None
    poteri_rappresentanza: str | None = None
    limitazioni_rappresentanza: str | None = None
    data_decorrenza_rappresentanza: date | None = None
    data_scadenza_rappresentanza: date | None = None
    documento_rappresentanza_id: uuid.UUID | None = None
    note_rappresentanza: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    tipo_carica: str
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None


class AmministratoreCaricaUpdate(_OrmModel):
    persona_id: uuid.UUID | None = None
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    delega_presente: bool | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_attribuiti: str | None = None
    limitazioni_poteri: str | None = None
    legale_rappresentante: bool | None = None
    modalita_firma: str | None = None
    poteri_rappresentanza: str | None = None
    limitazioni_rappresentanza: str | None = None
    data_decorrenza_rappresentanza: date | None = None
    data_scadenza_rappresentanza: date | None = None
    documento_rappresentanza_id: uuid.UUID | None = None
    note_rappresentanza: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    tipo_carica: str | None = None
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None


class AmministratoreCaricaRead(AmministratoreCaricaCreate, _ReadMeta):
    pass


# ===========================================================================
# Attestazioni SOA (multipla) + categorie
# ===========================================================================


class SoaCategoriaIn(_OrmModel):
    categoria: str
    descrizione: str | None = None
    classifica: str | None = None
    limite_economico: Decimal | None = None


class SoaCategoriaRead(SoaCategoriaIn):
    id: uuid.UUID


class SoaUpsertBase(_OrmModel):
    numero_attestazione: str | None = None
    organismo_denominazione: str | None = None
    organismo_codice_identificativo: str | None = None
    data_rilascio: date | None = None
    data_scadenza: date | None = None
    regolamento: str | None = None


class SoaCreate(SoaUpsertBase):
    categorie: list[SoaCategoriaIn] = []


class SoaUpdate(SoaUpsertBase):
    categorie: list[SoaCategoriaIn] | None = None
    """Se presente, sostituisce integralmente le categorie esistenti."""


class SoaRead(SoaUpsertBase, _ReadMeta):
    categorie: list[SoaCategoriaRead] = []


# ===========================================================================
# Certificazioni possedute (multipla) + settori IAF
# ===========================================================================


class CertificazioneSettoreIafIn(_OrmModel):
    settore_iaf_id: uuid.UUID | None = None
    codice_iaf: str | None = None
    descrizione_iaf: str | None = None


class CertificazioneSettoreIafRead(CertificazioneSettoreIafIn):
    id: uuid.UUID


class CertificazioneUpsertBase(_OrmModel):
    certificazione_id: uuid.UUID | None = None
    tipologia_certificazione: str | None = None
    sigla: str | None = None
    norma_riferimento: str | None = None
    numero_certificato: str | None = None
    data_prima_emissione: date | None = None
    organismo_certificatore: str | None = None
    codice_fiscale_organismo: str | None = None
    fonte: str | None = None
    data_ultimo_aggiornamento: date | None = None


class CertificazioneCreate(CertificazioneUpsertBase):
    settori_iaf: list[CertificazioneSettoreIafIn] = []


class CertificazioneUpdate(CertificazioneUpsertBase):
    settori_iaf: list[CertificazioneSettoreIafIn] | None = None


class CertificazioneRead(CertificazioneUpsertBase, _ReadMeta):
    settori_iaf: list[CertificazioneSettoreIafRead] = []


# ===========================================================================
# Addetti da visura (multipla) + periodi
# ===========================================================================


class AddettiVisuraPeriodoIn(_OrmModel):
    periodo: PeriodoRilevazione
    numero_dipendenti: int | None = None
    numero_indipendenti: int | None = None
    numero_collaboratori: int | None = None
    numero_totale_addetti: int | None = None
    percentuale_tempo_determinato: Decimal | None = None
    percentuale_tempo_indeterminato: Decimal | None = None
    percentuale_tempo_pieno: Decimal | None = None
    percentuale_tempo_parziale: Decimal | None = None
    percentuale_operai: Decimal | None = None
    percentuale_impiegati: Decimal | None = None


class AddettiVisuraPeriodoRead(AddettiVisuraPeriodoIn):
    id: uuid.UUID


class AddettiVisuraUpsertBase(_OrmModel):
    fonte: str | None = None
    anno_riferimento: int | None = None
    data_rilevazione: date | None = None


class AddettiVisuraCreate(AddettiVisuraUpsertBase):
    periodi: list[AddettiVisuraPeriodoIn] = []


class AddettiVisuraUpdate(AddettiVisuraUpsertBase):
    periodi: list[AddettiVisuraPeriodoIn] | None = None


class AddettiVisuraRead(AddettiVisuraUpsertBase, _ReadMeta):
    periodi: list[AddettiVisuraPeriodoRead] = []


# ===========================================================================
# Addetti per comune (multipla) + periodi
# ===========================================================================


class AddettiComunePeriodoIn(_OrmModel):
    periodo: PeriodoRilevazione
    numero_dipendenti: int | None = None
    numero_indipendenti: int | None = None
    numero_totale_addetti: int | None = None


class AddettiComunePeriodoRead(AddettiComunePeriodoIn):
    id: uuid.UUID


class AddettiComuneUpsertBase(_OrmModel):
    rilevazione_addetti_id: uuid.UUID | None = None
    comune: str
    provincia: str | None = None
    numero_sedi_unita_locali: int | None = None


class AddettiComuneCreate(AddettiComuneUpsertBase):
    periodi: list[AddettiComunePeriodoIn] = []


class AddettiComuneUpdate(_OrmModel):
    rilevazione_addetti_id: uuid.UUID | None = None
    comune: str | None = None
    provincia: str | None = None
    numero_sedi_unita_locali: int | None = None
    periodi: list[AddettiComunePeriodoIn] | None = None


class AddettiComuneRead(AddettiComuneUpsertBase, _ReadMeta):
    periodi: list[AddettiComunePeriodoRead] = []


# ===========================================================================
# Albi, ruoli e licenze (multipla)
# ===========================================================================


class AlboRuoloLicenzaCreate(_OrmModel):
    tipologia: str
    numero_iscrizione: str | None = None
    provincia: str | None = None
    sezione: str | None = None
    categoria: str | None = None
    descrizione_categoria: str | None = None
    classe: str | None = None
    data_domanda_accertamento: date | None = None
    data_delibera: date | None = None
    data_inizio: date | None = None
    data_scadenza: date | None = None
    stato: str | None = None
    motivo_cancellazione: str | None = None
    data_comunicazione: date | None = None
    data_cessazione: date | None = None
    data_caricamento: date | None = None
    fonte: str | None = None


class AlboRuoloLicenzaUpdate(_OrmModel):
    tipologia: str | None = None
    numero_iscrizione: str | None = None
    provincia: str | None = None
    sezione: str | None = None
    categoria: str | None = None
    descrizione_categoria: str | None = None
    classe: str | None = None
    data_domanda_accertamento: date | None = None
    data_delibera: date | None = None
    data_inizio: date | None = None
    data_scadenza: date | None = None
    stato: str | None = None
    motivo_cancellazione: str | None = None
    data_comunicazione: date | None = None
    data_cessazione: date | None = None
    data_caricamento: date | None = None
    fonte: str | None = None


class AlboRuoloLicenzaRead(AlboRuoloLicenzaCreate, _ReadMeta):
    pass


# ===========================================================================
# Sedi (multipla)
# ===========================================================================


class SedeCreate(_OrmModel):
    tipo_sede: str
    numero_unita_locale: str | None = None
    denominazione_sede: str | None = None
    data_apertura: date | None = None
    indirizzo: str | None = None
    numero_civico: str | None = None
    cap: str | None = None
    comune: str | None = None
    provincia: str | None = None
    frazione: str | None = None
    nazione: str | None = None


class SedeUpdate(_OrmModel):
    tipo_sede: str | None = None
    numero_unita_locale: str | None = None
    denominazione_sede: str | None = None
    data_apertura: date | None = None
    indirizzo: str | None = None
    numero_civico: str | None = None
    cap: str | None = None
    comune: str | None = None
    provincia: str | None = None
    frazione: str | None = None
    nazione: str | None = None


class SedeRead(SedeCreate, _ReadMeta):
    pass


# ===========================================================================
# Contatti (multipla)
# ===========================================================================


class ContattoCreate(_OrmModel):
    tipo_contatto: str
    valore: str
    descrizione: str | None = None
    principale: bool = False


class ContattoUpdate(_OrmModel):
    tipo_contatto: str | None = None
    valore: str | None = None
    descrizione: str | None = None
    principale: bool | None = None


class ContattoRead(ContattoCreate, _ReadMeta):
    pass


# ===========================================================================
# Campi comuni alle qualifiche (catalogo A01-A51): definiti per esteso in
# ciascuno schema, senza ereditarietà condivisa, perché ogni qualifica ne
# usa un sottoinsieme diverso (cfr. cap. 3.3.2 del documento di progetto).
# ===========================================================================


class ResponsabileFerCreate(_OrmModel):
    persona_id: uuid.UUID
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    delega_presente: bool | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    titolo_studio_id: uuid.UUID | None = None
    abilitazione_professionale: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_attribuiti: str | None = None
    limitazioni_poteri: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    requisito_accesso: str | None = None
    tipo_incarico: str | None = None
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    lettere_abilitazione: str | None = None
    titolo_professionale_richiesto: str | None = None
    tipologia_rapporto: str | None = None
    settore_abilitazione: str | None = None
    autorita_competente: str | None = None
    ambito_validita: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None


class ResponsabileFerUpdate(ResponsabileFerCreate):
    persona_id: uuid.UUID | None = None  # type: ignore[assignment]


class ResponsabileFerRead(ResponsabileFerCreate, _ReadMeta):
    pass


class SindacoCreate(_OrmModel):
    persona_id: uuid.UUID
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    elezione_richiesta: bool | None = None
    verbale_elezione_id: uuid.UUID | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    iscrizione_albo: bool | None = None
    numero_iscrizione_albo: str | None = None
    ente_ordine_professionale: str | None = None
    abilitazione_professionale: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_attribuiti: str | None = None
    limitazioni_poteri: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    tipo_carica: str
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None


class SindacoUpdate(_OrmModel):
    persona_id: uuid.UUID | None = None
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    elezione_richiesta: bool | None = None
    verbale_elezione_id: uuid.UUID | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    iscrizione_albo: bool | None = None
    numero_iscrizione_albo: str | None = None
    ente_ordine_professionale: str | None = None
    abilitazione_professionale: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_attribuiti: str | None = None
    limitazioni_poteri: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    tipo_carica: str | None = None
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None


class SindacoRead(SindacoCreate, _ReadMeta):
    pass


class RevisoreLegaleCreate(_OrmModel):
    tipo_soggetto: TipoSoggetto
    persona_id: uuid.UUID | None = None
    denominazione_societa_revisione: str | None = None
    codice_fiscale_societa_revisione: str | None = None
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_attribuiti: str | None = None
    limitazioni_poteri: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    tipo_incarico: str
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    numero_iscrizione_registro_revisori: str | None = None
    data_iscrizione_registro_revisori: date | None = None
    stato_iscrizione_registro: str | None = None
    autorita_competente: str | None = None
    ambito_validita: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None


class RevisoreLegaleUpdate(_OrmModel):
    tipo_soggetto: TipoSoggetto | None = None
    persona_id: uuid.UUID | None = None
    denominazione_societa_revisione: str | None = None
    codice_fiscale_societa_revisione: str | None = None
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_attribuiti: str | None = None
    limitazioni_poteri: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    tipo_incarico: str | None = None
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    numero_iscrizione_registro_revisori: str | None = None
    data_iscrizione_registro_revisori: date | None = None
    stato_iscrizione_registro: str | None = None
    autorita_competente: str | None = None
    ambito_validita: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None


class RevisoreLegaleRead(RevisoreLegaleCreate, _ReadMeta):
    pass


class DirettoreTecnicoSoaCreate(_OrmModel):
    persona_id: uuid.UUID
    soa_id: uuid.UUID | None = None
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    delega_presente: bool | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    titolo_studio_id: uuid.UUID | None = None
    abilitazione_professionale: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_attribuiti: str | None = None
    limitazioni_poteri: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    requisito_accesso: str | None = None
    tipo_incarico: str | None = None
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    titolo_professionale: str | None = None
    tipologia_rapporto: str | None = None
    settore_abilitazione: str | None = None
    autorita_competente: str | None = None
    ambito_validita: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None


class DirettoreTecnicoSoaUpdate(DirettoreTecnicoSoaCreate):
    persona_id: uuid.UUID | None = None  # type: ignore[assignment]


class DirettoreTecnicoSoaRead(DirettoreTecnicoSoaCreate, _ReadMeta):
    pass


class AmministratoreDelegatoCreate(_OrmModel):
    persona_id: uuid.UUID
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    delega_presente: bool | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_delegati: str | None = None
    limitazioni_poteri: str | None = None
    legale_rappresentante: bool = False
    modalita_firma: str | None = None
    poteri_rappresentanza: str | None = None
    limitazioni_rappresentanza: str | None = None
    data_decorrenza_rappresentanza: date | None = None
    data_scadenza_rappresentanza: date | None = None
    documento_rappresentanza_id: uuid.UUID | None = None
    note_rappresentanza: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    tipo_incarico: str | None = None
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None


class AmministratoreDelegatoUpdate(_OrmModel):
    persona_id: uuid.UUID | None = None
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    delega_presente: bool | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_delegati: str | None = None
    limitazioni_poteri: str | None = None
    legale_rappresentante: bool | None = None
    modalita_firma: str | None = None
    poteri_rappresentanza: str | None = None
    limitazioni_rappresentanza: str | None = None
    data_decorrenza_rappresentanza: date | None = None
    data_scadenza_rappresentanza: date | None = None
    documento_rappresentanza_id: uuid.UUID | None = None
    note_rappresentanza: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    tipo_incarico: str | None = None
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None


class AmministratoreDelegatoRead(AmministratoreDelegatoCreate, _ReadMeta):
    pass


class ComponenteCdaCreate(_OrmModel):
    persona_id: uuid.UUID
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    elezione_richiesta: bool | None = None
    verbale_elezione_id: uuid.UUID | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_attribuiti: str | None = None
    limitazioni_poteri: str | None = None
    legale_rappresentante: bool = False
    modalita_firma: str | None = None
    poteri_rappresentanza: str | None = None
    limitazioni_rappresentanza: str | None = None
    data_decorrenza_rappresentanza: date | None = None
    data_scadenza_rappresentanza: date | None = None
    documento_rappresentanza_id: uuid.UUID | None = None
    note_rappresentanza: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    ruolo_nel_consiglio: str
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None
    rappresentante_impresa: bool | None = None


class ComponenteCdaUpdate(_OrmModel):
    persona_id: uuid.UUID | None = None
    data_assegnazione: date | None = None
    data_cessazione: date | None = None
    nomina_richiesta: bool | None = None
    documento_nomina_id: uuid.UUID | None = None
    elezione_richiesta: bool | None = None
    verbale_elezione_id: uuid.UUID | None = None
    interno_esterno: str | None = None
    durata: str | None = None
    assenza_cause_ostative: bool | None = None
    assenza_condanne: bool | None = None
    documento_aggiuntivo_id: uuid.UUID | None = None
    note: str | None = None
    data_decorrenza: date | None = None
    data_accettazione: date | None = None
    poteri_attribuiti: str | None = None
    limitazioni_poteri: str | None = None
    legale_rappresentante: bool | None = None
    modalita_firma: str | None = None
    poteri_rappresentanza: str | None = None
    limitazioni_rappresentanza: str | None = None
    data_decorrenza_rappresentanza: date | None = None
    data_scadenza_rappresentanza: date | None = None
    documento_rappresentanza_id: uuid.UUID | None = None
    note_rappresentanza: str | None = None
    stato_incarico: str | None = None
    motivo_cessazione: str | None = None
    ruolo_nel_consiglio: str | None = None
    criterio_scadenza: str | None = None
    documento_riferimento_id: uuid.UUID | None = None
    fonte_dato: str | None = None
    documento_qualifica_id: uuid.UUID | None = None
    data_atto_nomina: date | None = None
    data_prima_iscrizione: date | None = None
    data_scadenza: date | None = None
    rappresentante_impresa: bool | None = None


class ComponenteCdaRead(ComponenteCdaCreate, _ReadMeta):
    pass
