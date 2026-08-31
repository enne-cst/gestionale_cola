"""Modelli SQLAlchemy per il modulo Anagrafica Aziendale.

Mappano le tabelle già create dalla baseline (`database_struttura/Mod.
Anagrafica Aziendale/Dati estrapolati dalla CCIA/`). Non introducono nulla
di nuovo a schema: descrivono da codice una struttura dati che esiste già.

Le tabelle `qual_*` (soci, amministratori, sindaci, revisori, direttore
tecnico SOA, amministratore delegato, componente CdA, responsabile FER)
sono state eliminate (migrazione 0021/0022): duplicavano l'anagrafica
persona (`per_persone`, a sua volta sostituita da `ana_persone`) invece di
riferirla. Sostituite dal motore generico "ruolo + caratteristiche" del
modulo Personale (`per_incarichi`/`per_incarichi_valori`, vedi
`app/models/personale.py`), che collega `ana_persone` a `cat_ruoli` senza
duplicare dati anagrafici. Vedi `session-log/` per il dettaglio della
migrazione.
"""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, SmallInteger, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _id_col() -> Mapped[uuid.UUID]:
    return mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _azienda_fk() -> Mapped[uuid.UUID]:
    return mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))


# ===========================================================================
# 001 - Identificazione camerale (singleton)
# ===========================================================================


class AnaIdentificazioneCamerale(Base):
    __tablename__ = "ana_identificazione_camerale"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    ragione_sociale: Mapped[str | None] = mapped_column(String(255))
    forma_giuridica: Mapped[str | None] = mapped_column(String(150))
    codice_fiscale: Mapped[str | None] = mapped_column(String(16))
    partita_iva: Mapped[str | None] = mapped_column(String(11))

    camera_commercio_competente: Mapped[str | None] = mapped_column(String(150))
    ufficio_registro_imprese: Mapped[str | None] = mapped_column(String(150))

    numero_rea: Mapped[str | None] = mapped_column(String(30))
    provincia_rea: Mapped[str | None] = mapped_column(String(5))
    numero_iscrizione: Mapped[str | None] = mapped_column(String(50))
    data_iscrizione: Mapped[date | None]

    stato_attivita: Mapped[str | None] = mapped_column(String(100))

    data_atto_costitutivo: Mapped[date | None]
    data_inizio_attivita: Mapped[date | None]
    data_ultimo_protocollo: Mapped[date | None]
    # Formato GG/MM (vincolo CHECK lato DB, migrazione 0014): non e' una data
    # completa, si ripete ogni anno.
    termine_esercizio: Mapped[str | None] = mapped_column(String(5))
    inizio_esercizio: Mapped[str | None] = mapped_column(String(5))
    data_ultimo_bilancio_approvato: Mapped[date | None]

    # Trasferimento da altra provincia (migrazione 029, mappatura CCIAA §1.4).
    # "Presenza del trasferimento" e' derivabile da provincia_provenienza
    # IS NOT NULL, nessuna colonna dedicata.
    provincia_provenienza: Mapped[str | None] = mapped_column(String(5))
    numero_rea_precedente: Mapped[str | None] = mapped_column(String(30))
    data_trasferimento_provincia: Mapped[date | None]

    # Indicatori "L'impresa in cifre" non disponibili altrove (migrazione
    # 029, mappatura CCIAA §0.4).
    pratiche_ultimi_12_mesi: Mapped[int | None] = mapped_column(Integer)
    trasferimenti_quote: Mapped[int | None] = mapped_column(Integer)
    trasferimenti_sede: Mapped[int | None] = mapped_column(Integer)
    partecipazioni_altre_societa: Mapped[bool | None]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 002 - Iscrizioni registro imprese (multipla)
# ===========================================================================


class AnaIscrizioneRegistroImprese(Base):
    __tablename__ = "ana_iscrizioni_registro_imprese"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    tipo_iscrizione: Mapped[str | None] = mapped_column(String(150))
    sezione: Mapped[str | None] = mapped_column(String(150))
    data_iscrizione: Mapped[date | None]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 003 - Durata società ed esercizi (singleton)
# ===========================================================================


class AnaDurataSocietaEsercizi(Base):
    __tablename__ = "ana_durata_societa_esercizi"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    data_termine_societa: Mapped[date | None]
    scadenza_primo_esercizio: Mapped[date | None]
    scadenza_esercizi_successivi: Mapped[str | None] = mapped_column(String(50))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 004 - Attività esercitata (singleton)
# ===========================================================================


class AnaAttivitaEsercitata(Base):
    __tablename__ = "ana_attivita_esercitata"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    descrizione_attivita_esercitata: Mapped[str | None] = mapped_column(Text)
    data_decorrenza_attivita: Mapped[date | None]
    presenza_attivita_import_export: Mapped[bool | None]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 005 - Codici ATECO (multipla)
# ===========================================================================


class AnaCodiceAteco(Base):
    __tablename__ = "ana_codici_ateco"
    __table_args__ = (
        UniqueConstraint("azienda_id", "codice", "classificazione", "ruolo_codice", "origine_codice"),
    )

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    codice: Mapped[str] = mapped_column(String(20))
    descrizione: Mapped[str | None] = mapped_column(Text)

    classificazione: Mapped[str | None] = mapped_column(String(100))
    ruolo_codice: Mapped[str | None] = mapped_column(String(100))
    origine_codice: Mapped[str | None] = mapped_column(String(150))

    fonte: Mapped[str | None] = mapped_column(String(150))
    codice_nace: Mapped[str | None] = mapped_column(String(20))

    # Riferimento opzionale a una specifica unità locale (migrazione 028,
    # mappatura CCIAA §10.2); NULL = riferito all'intera azienda.
    sede_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("ana_sedi.id", ondelete="CASCADE")
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 006 - Capitale sociale (singleton)
# ===========================================================================


class AnaCapitaleSociale(Base):
    __tablename__ = "ana_capitale_sociale"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    valuta: Mapped[str | None] = mapped_column(String(3))
    capitale_deliberato: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    capitale_sottoscritto: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    capitale_versato: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# Catalogo - Organi amministrativi (Correzione 04)
# ===========================================================================


class CatOrganoAmministrativo(Base):
    """Catalogo estendibile degli organi amministrativi selezionabili nel
    campo "Organo amministrativo in carica" (sezione Amministrazione e
    controllo): Amministratore unico, Consiglio di amministrazione,
    Amministrazione pluripersonale congiuntiva/disgiuntiva."""

    __tablename__ = "cat_organi_amministrativi"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# Cataloghi - Durate di carica e regimi di rappresentanza (Correzione 05)
# ===========================================================================


class CatDurataCarica(Base):
    """Catalogo estendibile delle modalità di durata della carica (campo
    "Durata in carica" della configurazione "Amministratore unico"): a
    tempo indeterminato, fino a revoca, per un numero di esercizi, fino a
    una data stabilita."""

    __tablename__ = "cat_durate_carica"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatRegimeRappresentanza(Base):
    """Catalogo estendibile dei regimi di rappresentanza (campo "Regime di
    rappresentanza" della configurazione "Amministratore unico"). La
    compatibilità con ciascun organo amministrativo è modellata da
    `rel_organi_amministrativi_regimi_rappresentanza`, non da questo
    modello (nessuna relazione qui, per non introdurre dipendenze non
    ancora servite: il campo del frontend non filtra ancora le opzioni per
    organo, vedi migrazione 014)."""

    __tablename__ = "cat_regimi_rappresentanza"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# Cataloghi - Modalità di decisione e deleghe del consiglio (Correzione 06)
# ===========================================================================


class CatModalitaDecisioniConsiglio(Base):
    """Catalogo estendibile delle modalità con cui il consiglio di
    amministrazione assume le proprie decisioni (campo "Modalità delle
    decisioni del consiglio" della configurazione "Consiglio di
    amministrazione")."""

    __tablename__ = "cat_modalita_decisioni_consiglio"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatDelegheConsiglio(Base):
    """Catalogo estendibile delle deleghe attribuibili dal consiglio di
    amministrazione (campo "Deleghe del consiglio" della configurazione
    "Consiglio di amministrazione")."""

    __tablename__ = "cat_deleghe_consiglio"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# Catalogo - Modalità di esercizio dei poteri (Correzione 07)
# ===========================================================================


class CatModalitaEsercizioPoteri(Base):
    """Catalogo estendibile delle modalità di esercizio dei poteri tra più
    amministratori (campo "Modalità di esercizio dei poteri" delle
    configurazioni "Amministrazione pluripersonale congiuntiva"/
    "disgiuntiva")."""

    __tablename__ = "cat_modalita_esercizio_poteri"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# Catalogo - Gestione dell'opposizione (Correzione 08)
# ===========================================================================


class CatGestioneOpposizione(Base):
    """Catalogo estendibile delle modalità di gestione dell'opposizione tra
    amministratori (campo "Gestione dell'opposizione" della configurazione
    "Amministrazione pluripersonale disgiuntiva"). Solo due opzioni oggi,
    ma trattato come catalogo per esplicita richiesta dell'utente (§
    Correzione 08): rappresenta una classificazione aziendale destinata a
    evolversi, non va scritto direttamente nel frontend."""

    __tablename__ = "cat_gestione_opposizione"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# Cataloghi - Assetti di controllo e titoli della nomina (Correzione 11)
# ===========================================================================


class CatAssettoControllo(Base):
    """Catalogo estendibile degli assetti di controllo selezionabili nel
    campo "Assetto di controllo in carica" (sezione Organi di controllo,
    card "Sindaci"): Nessun organo di controllo o revisore, Sindaco unico,
    Collegio sindacale, Revisore legale persona fisica, Società di
    revisione legale, Sindaco unico + revisore esterno, Collegio sindacale
    + revisore esterno."""

    __tablename__ = "cat_assetti_controllo"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatTitoloNominaOrganoControllo(Base):
    """Catalogo estendibile (ancora vuoto, § Correzione 11: opzioni
    definite separatamente) dei titoli della nomina selezionabili nel campo
    "Titolo della nomina" (sezione Organi di controllo)."""

    __tablename__ = "cat_titoli_nomina_organo_controllo"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# Cataloghi - Configurazione "Sindaco unico" (Correzione 13)
# ===========================================================================


class CatFunzioneOrganoInterno(Base):
    """Catalogo estendibile delle funzioni dell'organo interno di
    controllo (campo "Funzioni dell'organo interno" della configurazione
    "Sindaco unico"): Vigilanza sulla gestione, Vigilanza sulla gestione e
    revisione legale, Competenze definite dall'atto costitutivo."""

    __tablename__ = "cat_funzioni_organo_interno"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatAffidatarioRevisioneLegale(Base):
    """Catalogo estendibile, condiviso da tutte le configurazioni della
    sezione Organi di controllo (campo "Revisione legale affidata a"): Non
    attribuita, Sindaco unico, Collegio sindacale, Revisore legale persona
    fisica, Società di revisione legale."""

    __tablename__ = "cat_affidatari_revisione_legale"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatDurataIncaricoOrganoControllo(Base):
    """Catalogo estendibile delle tipologie di durata dell'incarico per gli
    organi di controllo (campo "Durata dell'incarico" della configurazione
    "Sindaco unico"), distinto da `CatDurataCarica` (Amministratori):
    Fino all'approvazione del bilancio, Tre esercizi, Fino a revoca o
    cessazione, Altra durata risultante dall'atto di nomina."""

    __tablename__ = "cat_durate_incarico_organi_controllo"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 041 - Organi di controllo (singleton, Correzione 11) - vedi
#        041_ana_organi_controllo.sql
# ===========================================================================


class AnaOrganiControllo(Base):
    """Impostazioni generali della card "Sindaci e membri degli organi di
    controllo" (Correzione 11): assetto di controllo in carica, numero
    componenti, titolo della nomina. 1:1 con l'azienda, come
    `AnaAmministrazioneControllo`.

    Sezione indipendente da `AnaAmministrazioneControllo`: quella tabella
    restava finora condivisa (senza una configurazione propria) dalla card
    "Sindaci", ma una `SezioneRegistro` non può avere due campi guida
    indipendenti (uno per "Amministratori", uno per "Sindaci"), ciascuno
    con la propria cascata di campi condizionali — vedi il commento in
    testa a `041_ana_organi_controllo.sql`."""

    __tablename__ = "ana_organi_controllo"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    assetto_controllo_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_assetti_controllo.id")
    )
    # Correzione 11: "Numero componenti" resta scrivibile qui solo per le
    # configurazioni ancora non definite — "Sindaco unico" (Correzione 13)
    # non lo usa più, sincronizzato invece via campo derivato
    # (`numero_componenti_organo` in registro_campi.py).
    numero_componenti: Mapped[int | None] = mapped_column(Integer)
    titolo_nomina_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_titoli_nomina_organo_controllo.id")
    )

    # Correzione 13 (configurazione "Sindaco unico"):
    funzioni_organo_interno_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_funzioni_organo_interno.id")
    )
    # Catalogo condiviso da tutte le configurazioni della sezione (§
    # richiesta esplicita): non solo di "Sindaco unico".
    revisione_legale_affidata_a_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_affidatari_revisione_legale.id")
    )
    durata_incarico_tipo_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_durate_incarico_organi_controllo.id")
    )
    durata_incarico_data_bilancio: Mapped[date | None] = mapped_column(Date)
    durata_incarico_descrizione: Mapped[str | None] = mapped_column(Text)

    # Correzione 14 (configurazione "Collegio sindacale"): solo 3 o 5,
    # vincolo di dominio (CHECK in 043_ana_organi_controllo_collegio_sindacale.sql),
    # non una classificazione estendibile — mai un catalogo. "Sindaci
    # supplenti" (sempre 2) e "Numero componenti" (sindaci_effettivi + 2)
    # non hanno colonna propria, calcolati lato backend.
    sindaci_effettivi: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 007 - Amministrazione e controllo (singleton) + sistemi di amministrazione
# ===========================================================================


class AnaAmministrazioneControllo(Base):
    __tablename__ = "ana_amministrazione_controllo"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    # Correzione 04: chiave esterna al catalogo cat_organi_amministrativi,
    # mai la denominazione come testo libero (§ campo principale, mostrato
    # per primo, della sezione "Amministratori").
    organo_amministrativo_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_organi_amministrativi.id")
    )

    numero_minimo_amministratori: Mapped[int | None] = mapped_column(Integer)
    numero_amministratori_in_carica: Mapped[int | None] = mapped_column(Integer)

    durata_in_carica_organo: Mapped[str | None] = mapped_column(String(255))

    numero_sindaci_organi_controllo: Mapped[int | None] = mapped_column(Integer)
    numero_titolari_cariche: Mapped[int | None] = mapped_column(Integer)

    # Correzione 05 (configurazione "Amministratore unico"): "Numero
    # componenti" non ha una colonna propria, vale sempre 1 per definizione
    # (calcolato, mai un inserimento manuale — vedi campi_derivati in
    # `app/core/registro_campi.py`).
    durata_carica_tipo_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_durate_carica.id")
    )
    durata_carica_numero_esercizi: Mapped[int | None] = mapped_column(Integer)
    durata_carica_data_scadenza: Mapped[date | None] = mapped_column(Date)
    regime_rappresentanza_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_regimi_rappresentanza.id")
    )

    # Correzione 06 (configurazione "Consiglio di amministrazione"): "Numero
    # componenti" riusa `numero_amministratori_in_carica` sopra (nessuna
    # colonna nuova, solo riassegnato lato registro_campi.py), "Durata in
    # carica"/"Regime di rappresentanza" riusano le colonne della
    # Correzione 05 sopra.
    modalita_decisioni_consiglio_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_modalita_decisioni_consiglio.id")
    )
    deleghe_consiglio_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_deleghe_consiglio.id")
    )

    # Correzione 07 (configurazione "Amministrazione pluripersonale
    # congiuntiva"): "Numero componenti"/"Durata in carica"/"Regime di
    # rappresentanza" riusano le colonne già esistenti sopra (nessuna
    # colonna nuova, solo riassegnate lato registro_campi.py).
    modalita_esercizio_poteri_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_modalita_esercizio_poteri.id")
    )

    # Correzione 08 (configurazione "Amministrazione pluripersonale
    # disgiuntiva"): "Numero componenti", "Durata in carica"/"Regime di
    # rappresentanza" e "Modalità di esercizio dei poteri" riusano le
    # colonne già esistenti sopra (nessuna colonna nuova, solo riassegnate
    # lato registro_campi.py). Solo "Gestione dell'opposizione" è propria di
    # questo organo.
    gestione_opposizione_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_gestione_opposizione.id")
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AnaSistemaAmministrazione(Base):
    __tablename__ = "ana_sistemi_amministrazione"
    __table_args__ = (UniqueConstraint("amministrazione_controllo_id", "sistema_amministrazione"),)

    id: Mapped[uuid.UUID] = _id_col()
    amministrazione_controllo_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("ana_amministrazione_controllo.id", ondelete="CASCADE")
    )
    sistema_amministrazione: Mapped[str] = mapped_column(String(255))

    # Dettaglio dell'organo previsto dallo statuto (migrazione 025,
    # mappatura CCIAA §2.4.4): regole generali, non la nomina effettiva di
    # una persona (quella vive in per_incarichi).
    numero_minimo_componenti: Mapped[int | None] = mapped_column(Integer)
    numero_massimo_componenti: Mapped[int | None] = mapped_column(Integer)
    regole_decisionali: Mapped[str | None] = mapped_column(Text)
    deleghe_previste: Mapped[str | None] = mapped_column(Text)
    regime_rappresentanza: Mapped[str | None] = mapped_column(Text)
    gestione_opposizione: Mapped[str | None] = mapped_column(Text)
    in_carica: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 010 - Attestazioni SOA (multipla) + categorie SOA
# ===========================================================================


class AnaSoa(Base):
    __tablename__ = "ana_soa"
    __table_args__ = (UniqueConstraint("azienda_id", "numero_attestazione"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    numero_attestazione: Mapped[str | None] = mapped_column(String(100))
    organismo_denominazione: Mapped[str | None] = mapped_column(String(255))
    organismo_codice_identificativo: Mapped[str | None] = mapped_column(String(50))
    data_rilascio: Mapped[date | None]
    data_scadenza: Mapped[date | None]
    regolamento: Mapped[str | None] = mapped_column(String(150))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AnaSoaCategoria(Base):
    __tablename__ = "ana_soa_categorie"
    __table_args__ = (UniqueConstraint("soa_id", "categoria"),)

    id: Mapped[uuid.UUID] = _id_col()
    soa_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_soa.id", ondelete="CASCADE"))

    categoria: Mapped[str] = mapped_column(String(20))
    descrizione: Mapped[str | None] = mapped_column(Text)
    classifica: Mapped[str | None] = mapped_column(String(20))
    limite_economico: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 011 - Certificazioni possedute (multipla) + settori IAF delle certificazioni
# ===========================================================================


class AnaCertificazione(Base):
    __tablename__ = "ana_certificazioni"
    __table_args__ = (UniqueConstraint("azienda_id", "numero_certificato"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    certificazione_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_certificazioni.id")
    )

    tipologia_certificazione: Mapped[str | None] = mapped_column(String(255))
    sigla: Mapped[str | None] = mapped_column(String(50))
    norma_riferimento: Mapped[str | None] = mapped_column(String(150))
    numero_certificato: Mapped[str | None] = mapped_column(String(100))
    data_prima_emissione: Mapped[date | None]
    organismo_certificatore: Mapped[str | None] = mapped_column(String(255))
    codice_fiscale_organismo: Mapped[str | None] = mapped_column(String(16))
    fonte: Mapped[str | None] = mapped_column(String(100))
    data_ultimo_aggiornamento: Mapped[date | None]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AnaCertificazioneSettoreIAF(Base):
    __tablename__ = "ana_certificazioni_settori_iaf"
    __table_args__ = (UniqueConstraint("certificazione_azienda_id", "codice_iaf"),)

    id: Mapped[uuid.UUID] = _id_col()
    certificazione_azienda_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("ana_certificazioni.id", ondelete="CASCADE")
    )
    settore_iaf_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_settori_iaf.id")
    )

    codice_iaf: Mapped[str | None] = mapped_column(String(20))
    descrizione_iaf: Mapped[str | None] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 012 - Addetti da visura (multipla) + periodi
# ===========================================================================


class AnaAddettiVisura(Base):
    __tablename__ = "ana_addetti_visura"
    __table_args__ = (UniqueConstraint("azienda_id", "fonte", "anno_riferimento", "data_rilevazione"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    fonte: Mapped[str | None] = mapped_column(String(100))
    anno_riferimento: Mapped[int | None] = mapped_column(Integer)
    data_rilevazione: Mapped[date | None]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AnaAddettiVisuraPeriodo(Base):
    __tablename__ = "ana_addetti_visura_periodi"
    __table_args__ = (UniqueConstraint("rilevazione_addetti_id", "periodo"),)

    id: Mapped[uuid.UUID] = _id_col()
    rilevazione_addetti_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("ana_addetti_visura.id", ondelete="CASCADE")
    )

    periodo: Mapped[str] = mapped_column(String(20))

    numero_dipendenti: Mapped[int | None] = mapped_column(Integer)
    numero_indipendenti: Mapped[int | None] = mapped_column(Integer)
    numero_collaboratori: Mapped[int | None] = mapped_column(Integer)
    numero_totale_addetti: Mapped[int | None] = mapped_column(Integer)

    percentuale_tempo_determinato: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    percentuale_tempo_indeterminato: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    percentuale_tempo_pieno: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    percentuale_tempo_parziale: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    percentuale_operai: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    percentuale_impiegati: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 013 - Addetti per comune (multipla) + periodi
# ===========================================================================


class AnaAddettiComune(Base):
    __tablename__ = "ana_addetti_comune"
    __table_args__ = (UniqueConstraint("rilevazione_addetti_id", "comune", "provincia"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    rilevazione_addetti_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("ana_addetti_visura.id", ondelete="CASCADE")
    )

    comune: Mapped[str] = mapped_column(String(150))
    provincia: Mapped[str | None] = mapped_column(String(5))
    numero_sedi_unita_locali: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AnaAddettiComunePeriodo(Base):
    __tablename__ = "ana_addetti_comune_periodi"
    __table_args__ = (UniqueConstraint("addetti_comune_id", "periodo"),)

    id: Mapped[uuid.UUID] = _id_col()
    addetti_comune_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("ana_addetti_comune.id", ondelete="CASCADE")
    )

    periodo: Mapped[str] = mapped_column(String(20))

    numero_dipendenti: Mapped[int | None] = mapped_column(Integer)
    numero_indipendenti: Mapped[int | None] = mapped_column(Integer)
    numero_totale_addetti: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 014 - Albi, ruoli e licenze (multipla)
# ===========================================================================


class AnaAlboRuoloLicenza(Base):
    __tablename__ = "ana_albi_ruoli_licenze"
    __table_args__ = (UniqueConstraint("azienda_id", "tipologia", "numero_iscrizione", "categoria"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    tipologia: Mapped[str] = mapped_column(String(255))

    numero_iscrizione: Mapped[str | None] = mapped_column(String(100))
    provincia: Mapped[str | None] = mapped_column(String(5))
    sezione: Mapped[str | None] = mapped_column(String(150))

    categoria: Mapped[str | None] = mapped_column(String(100))
    descrizione_categoria: Mapped[str | None] = mapped_column(Text)
    classe: Mapped[str | None] = mapped_column(String(100))

    data_domanda_accertamento: Mapped[date | None]
    data_delibera: Mapped[date | None]

    data_inizio: Mapped[date | None]
    data_scadenza: Mapped[date | None]

    stato: Mapped[str | None] = mapped_column(String(100))
    motivo_cancellazione: Mapped[str | None] = mapped_column(Text)

    data_comunicazione: Mapped[date | None]
    data_cessazione: Mapped[date | None]
    data_caricamento: Mapped[date | None]

    fonte: Mapped[str | None] = mapped_column(String(150))

    # Riferimento opzionale a una specifica unità locale (migrazione 028,
    # mappatura CCIAA §10.2); NULL = riferito all'intera azienda.
    sede_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("ana_sedi.id", ondelete="CASCADE")
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 015 - Sedi (multipla)
# ===========================================================================


class AnaSede(Base):
    __tablename__ = "ana_sedi"
    __table_args__ = (UniqueConstraint("azienda_id", "numero_unita_locale"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    tipo_sede: Mapped[str] = mapped_column(String(100))
    numero_unita_locale: Mapped[str | None] = mapped_column(String(50))
    denominazione_sede: Mapped[str | None] = mapped_column(String(255))

    data_apertura: Mapped[date | None]

    indirizzo: Mapped[str | None] = mapped_column(String(255))
    numero_civico: Mapped[str | None] = mapped_column(String(20))
    cap: Mapped[str | None] = mapped_column(String(10))

    comune: Mapped[str | None] = mapped_column(String(150))
    provincia: Mapped[str | None] = mapped_column(String(5))
    frazione: Mapped[str | None] = mapped_column(String(150))

    nazione: Mapped[str | None] = mapped_column(String(100))

    # Componenti dell'indirizzo e dettaglio unità locale (migrazione 026,
    # mappatura CCIAA §1.1/§10.2). `indirizzo` resta la denominazione
    # stradale; `toponimo` la precede (es. "Via" + "Roma").
    toponimo: Mapped[str | None] = mapped_column(String(30))
    indirizzo_originale: Mapped[str | None] = mapped_column(Text)
    numero_rea_unita: Mapped[str | None] = mapped_column(String(30))
    data_chiusura: Mapped[date | None]
    stato: Mapped[str | None] = mapped_column(String(50))
    sigla_territoriale: Mapped[str | None] = mapped_column(String(10))
    numero_progressivo: Mapped[str | None] = mapped_column(String(20))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AnaSedeAttivita(Base):
    """Attività esercitata presso una specifica unità locale (migrazione
    027, mappatura CCIAA §10.2). Distinta da `AnaAttivitaEsercitata`
    (attività dell'intera impresa) e da `AnaCodiceAteco` (classificazioni)."""

    __tablename__ = "ana_sedi_attivita"

    id: Mapped[uuid.UUID] = _id_col()
    sede_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_sedi.id", ondelete="CASCADE"))

    descrizione_attivita: Mapped[str] = mapped_column(Text)
    data_inizio: Mapped[date | None]
    data_fine: Mapped[date | None]
    ruolo_importanza: Mapped[str | None] = mapped_column(String(50))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 016 - Contatti (multipla)
# ===========================================================================


class AnaContatto(Base):
    __tablename__ = "ana_contatti"
    __table_args__ = (UniqueConstraint("azienda_id", "tipo_contatto", "valore"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    tipo_contatto: Mapped[str] = mapped_column(String(100))
    valore: Mapped[str] = mapped_column(String(255))
    descrizione: Mapped[str | None] = mapped_column(String(255))
    principale: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 032 - Sede (pilota, singleton) - vedi 032_ana_sede_rev2.sql
# ===========================================================================


class AnaSedeRev2(Base):
    """Card "Sede" (sezione 1 della visura) replicata 1:1 dal prototipo HTML,
    1:1 con l'azienda come `AnaCapitaleSociale`. Tabella pilota: duplica
    intenzionalmente colonne già presenti in `AnaIdentificazioneCamerale`
    (codice fiscale, partita IVA, REA, camera di commercio, provenienza del
    trasferimento) e in `AnaSede`/`ana_sedi` (indirizzo/comune/provincia/
    CAP/nazione) — vedi il commento in testa a `032_ana_sede_rev2.sql` per la
    motivazione e per cosa resta da fare prima di eliminare le tabelle
    diventate obsolete."""

    __tablename__ = "ana_sede_rev2"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    indirizzo_sede_legale: Mapped[str | None] = mapped_column(String(255))
    comune: Mapped[str | None] = mapped_column(String(150))
    provincia: Mapped[str | None] = mapped_column(String(100))
    cap: Mapped[str | None] = mapped_column(String(10))
    nazione: Mapped[str | None] = mapped_column(String(100))

    pec: Mapped[str | None] = mapped_column(String(255))
    partita_iva: Mapped[str | None] = mapped_column(String(11))
    codice_fiscale: Mapped[str | None] = mapped_column(String(16))
    numero_rea: Mapped[str | None] = mapped_column(String(30))
    camera_commercio_competente: Mapped[str | None] = mapped_column(String(150))

    provincia_provenienza: Mapped[str | None] = mapped_column(String(100))
    numero_rea_precedente: Mapped[str | None] = mapped_column(String(30))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 033 - Informazioni da statuto/atto costitutivo (pilota, singleton) -
#        vedi 033_ana_statuto_rev2.sql
# ===========================================================================


class AnaStatutoRev2(Base):
    """Card "Informazioni da statuto/atto costitutivo" (sezione 2 della
    visura) replicata 1:1 dal prototipo HTML, 1:1 con l'azienda. Tabella
    pilota, stesso criterio di `AnaSedeRev2`: duplica intenzionalmente
    concetti già presenti in `AnaIdentificazioneCamerale`,
    `AnaDurataSocietaEsercizi` e `AnaAmministrazioneControllo` — vedi il
    commento in testa a `033_ana_statuto_rev2.sql` per la motivazione e per
    cosa resta da fare prima di eliminare le tabelle diventate obsolete."""

    __tablename__ = "ana_statuto_rev2"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    denominazione: Mapped[str | None] = mapped_column(String(255))
    registro_imprese: Mapped[str | None] = mapped_column(String(150))
    data_iscrizione: Mapped[date | None]
    forma_giuridica: Mapped[str | None] = mapped_column(String(150))
    data_atto_costitutivo: Mapped[date | None]

    data_termine_societa: Mapped[date | None]
    scadenza_primo_esercizio: Mapped[date | None]
    scadenza_esercizi_successivi: Mapped[str | None] = mapped_column(String(50))
    giorni_proroga_approvazione_bilancio: Mapped[int | None] = mapped_column(Integer)

    sistema_amministrazione_adottato: Mapped[str | None] = mapped_column(String(150))
    controllo_contabile: Mapped[str | None] = mapped_column(String(150))
    organi_amministrativi_previsti: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ===========================================================================
# 030 - Estremi dell'elenco soci (singleton)
# ===========================================================================


class AnaElencoSociEstremi(Base):
    """Dato di testata dell'elenco soci depositato (mappatura CCIAA §4.2),
    1:1 con l'azienda come `AnaCapitaleSociale`. Non è un dato del singolo
    socio (quello vive in `per_incarichi`/`per_incarichi_valori`, ruolo
    SOCIO).

    `data_atto`/`data_protocollo`/`capitale_sociale_dichiarato` rimossi
    (migrazione 035, tabella mai popolata in produzione): i primi due non
    previsti dal catalogo campi confermato dall'utente per la card "Soci e
    titolari di diritti su azioni e quote" del prototipo HTML; il terzo è
    ora un campo derivato da `AnaCapitaleSociale.capitale_sottoscritto`
    (vedi `app/core/registro_campi.py::_capitale_rappresentato_di`), non più
    una colonna propria — evita di duplicare un dato già presente nella
    sezione "Capitale sociale"."""

    __tablename__ = "ana_elenco_soci_estremi"
    __table_args__ = (UniqueConstraint("azienda_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    data_riferimento: Mapped[date | None]
    data_deposito: Mapped[date | None]
    numero_protocollo: Mapped[str | None] = mapped_column(String(50))

    # § richiesta esplicita (31/08/2026, migrazione 044): "Numero dei soci"
    # diventa una capienza dichiarata modificabile, sincronizzata con gli
    # incarichi ruolo SOCIO — stesso comportamento di
    # AnaAmministrazioneControllo.numero_amministratori_in_carica, non più
    # un puro conteggio calcolato senza colonna propria (§ superata la
    # decisione della migrazione 035 solo per questo campo, vedi
    # app/core/incarichi.py::imposta_numero_soci).
    numero_soci: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
