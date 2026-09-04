import uuid
from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, SmallInteger, String, Text, Time, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _id_col() -> Mapped[uuid.UUID]:
    return mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _azienda_fk() -> Mapped[uuid.UUID]:
    return mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))


class CatLivelloSinteticoPersonale(Base):
    """Catalogo Livello 1/2/3 usato dagli indicatori sintetici di AnaPersone
    (conoscenza dell'organizzazione, competenze, consapevolezza)."""

    __tablename__ = "cat_livelli_sintetici_personale"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(30))
    denominazione: Mapped[str] = mapped_column(String(100))
    valore: Mapped[int] = mapped_column(SmallInteger)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)


class AnaPersone(Base):
    """Anagrafica unica delle persone fisiche collegate a un'azienda.

    Fonte autorevole dei dati anagrafici (sostituisce `per_persone`, ora
    eliminata): ogni relazione/carica/incarico verso una persona — sia nel
    modulo Personale (`per_incarichi`) sia in futuro nella vista CCIAA — deve
    riferire questa tabella tramite `persona_id`, mai duplicarne i campi.
    """

    __tablename__ = "ana_persone"
    __table_args__ = (UniqueConstraint("azienda_id", "codice_fiscale"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    fotografia: Mapped[str | None] = mapped_column(Text)
    cognome: Mapped[str] = mapped_column(String(150))
    nome: Mapped[str] = mapped_column(String(150))
    sesso: Mapped[str | None] = mapped_column(String(50))
    data_nascita: Mapped[date | None]
    luogo_nascita: Mapped[str | None] = mapped_column(String(200))
    nazionalita: Mapped[str | None] = mapped_column(String(100))
    conoscenza_lingua_italiana: Mapped[str | None] = mapped_column(String(100))
    codice_fiscale: Mapped[str] = mapped_column(String(32))
    # Superata dalla migrazione 018 (indirizzo_residenza + comune/CAP/
    # provincia strutturati sotto): mantenuta solo per non perdere i dati
    # storici, nessuno schema applicativo la legge o la scrive più.
    residenza: Mapped[str | None] = mapped_column(Text)
    # Campi "sempre visibili" della card Dati essenziali (modulo Personale
    # §12.1) — mancanti fino alla migrazione 017, aggiunti costruendo il
    # tab Persona e rapporto.
    telefono: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(255))

    # Dossier personale (§12.3, migrazione 018) — anagrafica completa,
    # residenza/domicilio, contatti di emergenza, lingua, documenti. Sesso/
    # data_nascita/luogo_nascita/nazionalita/conoscenza_lingua_italiana sopra
    # restano le colonne riusate anche qui, non duplicate.
    matricola_interna: Mapped[str | None] = mapped_column(String(50))
    provincia_nascita: Mapped[str | None] = mapped_column(String(100))
    stato_nascita: Mapped[str | None] = mapped_column(String(100))

    indirizzo_residenza: Mapped[str | None] = mapped_column(String(255))
    cap_residenza: Mapped[str | None] = mapped_column(String(10))
    comune_residenza: Mapped[str | None] = mapped_column(String(150))
    provincia_residenza: Mapped[str | None] = mapped_column(String(100))
    domicilio_coincide_residenza: Mapped[bool] = mapped_column(Boolean, default=True)
    indirizzo_domicilio: Mapped[str | None] = mapped_column(String(255))
    cap_domicilio: Mapped[str | None] = mapped_column(String(10))
    comune_domicilio: Mapped[str | None] = mapped_column(String(150))
    provincia_domicilio: Mapped[str | None] = mapped_column(String(100))

    contatto_emergenza_nome: Mapped[str | None] = mapped_column(String(200))
    contatto_emergenza_relazione: Mapped[str | None] = mapped_column(String(100))
    contatto_emergenza_telefono: Mapped[str | None] = mapped_column(String(50))

    lingua_madre: Mapped[str | None] = mapped_column(String(100))
    supporto_linguistico_necessario: Mapped[bool] = mapped_column(Boolean, default=False)
    altre_lingue: Mapped[str | None] = mapped_column(Text)

    # Superate dalla migrazione 019 (per_documenti_personali, sotto):
    # consentivano un solo documento per persona. Mantenute per lo storico,
    # non più lette né scritte da alcuno schema applicativo.
    tipo_documento_identita: Mapped[str | None] = mapped_column(String(100))
    numero_documento_identita: Mapped[str | None] = mapped_column(String(100))
    scadenza_documento_identita: Mapped[date | None]
    permesso_soggiorno_stato: Mapped[str] = mapped_column(String(20), default="NON_INDICATO")
    permesso_soggiorno_dettaglio: Mapped[str | None] = mapped_column(String(200))

    tipologia_contratto: Mapped[str | None] = mapped_column(String(200))
    data_assunzione: Mapped[date | None]
    data_fine_rapporto: Mapped[date | None]
    mansione: Mapped[str | None] = mapped_column(String(200))
    persona_backup_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("ana_persone.id")
    )
    processi_speciali_eseguiti: Mapped[str | None] = mapped_column(Text)
    conoscenza_organizzazione_livello_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_livelli_sintetici_personale.id")
    )
    competenze_livello_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_livelli_sintetici_personale.id")
    )
    consapevolezza_livello_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_livelli_sintetici_personale.id")
    )
    frequenza_visite_mediche: Mapped[int | None]

    altro: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AnaPersonaGiuridica(Base):
    """Anagrafica delle persone giuridiche (società, enti) collegate a
    un'azienda (§ Correzione 16) — titolare alternativo di un incarico
    (`PerIncarico.persona_giuridica_id`) per i ruoli affidabili a un
    soggetto esterno, primo caso "Società di revisione legale". Nessun
    campo proprio di una persona fisica: solo i dati identificativi del
    soggetto giuridico, il resto (caratteristiche dell'incarico, verifica,
    audit) è condiviso e invariato con `AnaPersone`."""

    __tablename__ = "ana_persone_giuridiche"
    __table_args__ = (UniqueConstraint("azienda_id", "codice_fiscale"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()

    denominazione: Mapped[str] = mapped_column(String(300))
    codice_fiscale: Mapped[str] = mapped_column(String(32))
    partita_iva: Mapped[str | None] = mapped_column(String(20))
    sede: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatRuolo(Base):
    """Catalogo estendibile dei ruoli utilizzabili negli incarichi (34 ruoli
    iniziali R001-R034, esteso con SOCIO/R035 per la relazione camerale di
    partecipazione)."""

    __tablename__ = "cat_ruoli"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(60))
    codice_documento: Mapped[str | None] = mapped_column(String(10))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    ruolo_sistema: Mapped[bool] = mapped_column(Boolean, default=True)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)
    # Ambito del ruolo (Governance/Sicurezza/Qualità/Ambiente/Organizzazione/
    # Altro, modulo Personale §13.1) — NULL finché la mappatura dei ruoli
    # esistenti non è stata proposta e approvata voce per voce.
    ambito: Mapped[str | None] = mapped_column(String(30))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatCaratteristicaIncarico(Base):
    """Catalogo configurabile delle caratteristiche A01-A56 utilizzabili nei
    ruoli/incarichi (A52-A56 aggiunte per rappresentare la partecipazione
    societaria del ruolo SOCIO, senza colonne dedicate)."""

    __tablename__ = "cat_caratteristiche_incarico"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(10))
    denominazione: Mapped[str] = mapped_column(String(250))
    descrizione: Mapped[str | None] = mapped_column(Text)
    tipo_dato: Mapped[str] = mapped_column(String(30))
    unita_misura: Mapped[str | None] = mapped_column(String(50))
    valori_ammessi: Mapped[dict | list | None] = mapped_column(JSONB)
    regola_validazione: Mapped[str | None] = mapped_column(Text)
    sensibile: Mapped[bool] = mapped_column(Boolean, default=False)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RelRuoloCaratteristica(Base):
    """Configurazione delle caratteristiche richieste per ciascun ruolo
    (obbligatorietà valutata lato applicativo, non nel catalogo)."""

    __tablename__ = "rel_ruoli_caratteristiche"

    ruolo_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_ruoli.id"), primary_key=True)
    caratteristica_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_caratteristiche_incarico.id"), primary_key=True
    )
    obbligatorieta: Mapped[str] = mapped_column(String(20), default="OBBLIGATORIA")
    condizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerIncarico(Base):
    """Relazione persona-ruolo (sostituisce le tabelle `qual_*`, incluso il
    ruolo SOCIO per le partecipazioni). I dati della carica/incarico vivono
    esclusivamente in `PerIncaricoValore`, non su questa riga, per non
    duplicare ciò che il catalogo caratteristiche già rappresenta (es. date
    di assegnazione/cessazione sono le caratteristiche A01/A02, non colonne
    qui).

    Titolare: esattamente uno tra `persona_id` (persona fisica) e
    `persona_giuridica_id` (persona giuridica, § Correzione 16) è
    valorizzato — vincolo `chk_per_incarichi_titolare_esclusivo` a livello
    DB, non verificabile qui a livello di colonna."""

    __tablename__ = "per_incarichi"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id"))
    persona_giuridica_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("ana_persone_giuridiche.id")
    )
    ruolo_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_ruoli.id"))
    note: Mapped[str | None] = mapped_column(Text)
    # Fonte e stato (modulo Personale §13.1/§13.2) — attributi universali
    # dell'incarico, non caratteristiche opzionali per ruolo. Righe create
    # prima di questa colonna: fonte='CCIAA' per decisione esplicita, stato
    # derivato dalla caratteristica A02 (vedi migrazione 010).
    fonte: Mapped[str] = mapped_column(String(20), default="CCIAA")
    stato: Mapped[str] = mapped_column(String(20), default="ATTIVO")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerIncaricoValore(Base):
    """Valore di una singola caratteristica per un incarico. Una sola delle
    colonne `valore_*` è valorizzata, a seconda del `tipo_dato` della
    caratteristica collegata."""

    __tablename__ = "per_incarichi_valori"
    __table_args__ = (UniqueConstraint("incarico_id", "caratteristica_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    incarico_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("per_incarichi.id", ondelete="CASCADE")
    )
    caratteristica_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_caratteristiche_incarico.id")
    )

    valore_testo: Mapped[str | None] = mapped_column(Text)
    valore_numero: Mapped[Decimal | None] = mapped_column(Numeric(15, 4))
    valore_data: Mapped[date | None]
    valore_booleano: Mapped[bool | None]
    # Nessuna ForeignKey lato ORM: il vincolo esiste a livello DB (migrazione
    # Mod. Personale/006), ma `doc_documenti` non ha ancora un modello
    # SQLAlchemy (solo il placeholder SQL, vedi doc/AMBIENTE-SVILUPPO.md) —
    # dichiararla qui farebbe fallire la risoluzione del metadata.
    valore_documento_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))
    valore_multiplo: Mapped[dict | list | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatTipoRapporto(Base):
    """Catalogo globale di sistema dei tipi di rapporto aziendale
    (indeterminato/determinato/collaborazione/amministratore/altro,
    § modulo Personale §12.3)."""

    __tablename__ = "cat_tipi_rapporto"

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


class CatMansione(Base):
    """Catalogo delle mansioni, per azienda (§ modulo Personale §12/§22.4):
    ogni azienda definisce il proprio elenco, nessun valore di sistema."""

    __tablename__ = "cat_mansioni"
    __table_args__ = (UniqueConstraint("azienda_id", "codice"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    codice: Mapped[str] = mapped_column(String(80))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger, default=1)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatReparto(Base):
    """Catalogo dei reparti, per azienda (§ modulo Personale §12/§22.4):
    ogni azienda definisce il proprio elenco, nessun valore di sistema."""

    __tablename__ = "cat_reparti"
    __table_args__ = (UniqueConstraint("azienda_id", "codice"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    codice: Mapped[str] = mapped_column(String(80))
    denominazione: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger, default=1)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerRapportoAzienda(Base):
    """Storico dei rapporti aziendali di una persona (§ modulo Personale
    §12.2/§22.3). Mai sovrascritto: un cambio di mansione/reparto/
    tipologia chiude il periodo corrente (`data_fine_effettiva`) e ne apre
    uno nuovo. Le colonne di sintesi su `AnaPersone` (mansione,
    tipologia_contratto, date) vengono allineate dal servizio applicativo,
    non da un trigger DB."""

    __tablename__ = "per_rapporti_azienda"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))

    tipo_rapporto_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_tipi_rapporto.id"))
    data_inizio: Mapped[date]
    data_fine_prevista: Mapped[date | None]
    data_fine_effettiva: Mapped[date | None]
    mansione_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_mansioni.id"))
    reparto_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_reparti.id"))
    stato: Mapped[str] = mapped_column(String(20), default="ATTIVO")
    tempo_lavoro: Mapped[str] = mapped_column(String(20), default="PIENO")
    percentuale_part_time: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    ccnl: Mapped[str | None] = mapped_column(Text)
    livello_inquadramento: Mapped[str | None] = mapped_column(String(200))
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CfgRuoloAzienda(Base):
    """Configurazione aziendale del ruolo (§ modulo Personale §13.4-§13.7):
    una sola riga per (azienda, ruolo), condivisa da tutte le persone che
    ricoprono il ruolo. Non contiene assegnazioni individuali (restano in
    `PerIncarico`)."""

    __tablename__ = "cfg_ruoli_azienda"
    __table_args__ = (UniqueConstraint("azienda_id", "ruolo_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    ruolo_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_ruoli.id"))

    attivo: Mapped[bool] = mapped_column(Boolean, default=True)
    scopo: Mapped[str | None] = mapped_column(Text)
    riporta_a_testo: Mapped[str | None] = mapped_column(String(300))
    collabora_con_testo: Mapped[str | None] = mapped_column(String(300))
    version: Mapped[int] = mapped_column(default=1)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CfgRuoloMansionarioVoce(Base):
    """Attività/responsabilità/autorità del mansionario (§13.5), una voce
    per riga."""

    __tablename__ = "cfg_ruoli_mansionario_voci"

    id: Mapped[uuid.UUID] = _id_col()
    configurazione_ruolo_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cfg_ruoli_azienda.id", ondelete="CASCADE")
    )

    sezione: Mapped[str] = mapped_column(String(20))
    testo: Mapped[str] = mapped_column(Text)
    ordine: Mapped[int] = mapped_column(SmallInteger, default=1)
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RelRuoloVoceValutazione(Base):
    """Voci base di Conoscenza/Competenza/Consapevolezza apportate dal
    ruolo (§13.6)."""

    __tablename__ = "rel_ruoli_voci_valutazione"
    __table_args__ = (UniqueConstraint("configurazione_ruolo_id", "voce_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    configurazione_ruolo_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cfg_ruoli_azienda.id", ondelete="CASCADE")
    )
    voce_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_voci_valutazione_personale.id")
    )

    ordine: Mapped[int] = mapped_column(SmallInteger, default=1)
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)
    valid_from: Mapped[date | None]
    valid_to: Mapped[date | None]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatVoceValutazionePersonale(Base):
    """Catalogo condiviso delle voci di Conoscenza/Competenza/
    Consapevolezza (§22.8): identità stabile usata per deduplicare quando
    la stessa voce arriva da più fonti. `azienda_id` NULL = voce di
    sistema."""

    __tablename__ = "cat_voci_valutazione_personale"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))
    codice: Mapped[str] = mapped_column(String(80))
    macroarea: Mapped[str] = mapped_column(String(20))
    nome: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RelMansioneVoceValutazione(Base):
    """Voci base di valutazione apportate dalla mansione."""

    __tablename__ = "rel_mansioni_voci_valutazione"
    __table_args__ = (UniqueConstraint("mansione_id", "voce_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    mansione_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_mansioni.id", ondelete="CASCADE"))
    voce_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_voci_valutazione_personale.id")
    )

    ordine: Mapped[int] = mapped_column(SmallInteger, default=1)
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)
    valid_from: Mapped[date | None]
    valid_to: Mapped[date | None]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RelAziendaVoceValutazione(Base):
    """Voci base applicabili a tutta l'azienda a prescindere da ruolo o
    mansione ("profilo generale", §16.2/§22.9)."""

    __tablename__ = "rel_azienda_voci_valutazione"
    __table_args__ = (UniqueConstraint("azienda_id", "voce_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    voce_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_voci_valutazione_personale.id")
    )

    ordine: Mapped[int] = mapped_column(SmallInteger, default=1)
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)
    valid_from: Mapped[date | None]
    valid_to: Mapped[date | None]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerVoceValutazionePersonale(Base):
    """Voce di valutazione aggiunta da una singola persona (§16.9):
    appartiene solo a lei, non modifica ruolo o mansione."""

    __tablename__ = "per_voci_valutazione_personali"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))

    macroarea: Mapped[str] = mapped_column(String(20))
    nome: Mapped[str] = mapped_column(String(200))
    descrizione: Mapped[str | None] = mapped_column(Text)
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_utenti.id"))
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RelPersonaVoceNascosta(Base):
    """Eccezione individuale che nasconde una voce ereditata per una
    persona (§16.10): non modifica la fonte né cancella valutazioni."""

    __tablename__ = "rel_persone_voci_nascoste"
    __table_args__ = (UniqueConstraint("persona_id", "voce_id"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))
    voce_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_voci_valutazione_personale.id")
    )

    motivo: Mapped[str | None] = mapped_column(Text)
    hidden_by: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_utenti.id"))
    hidden_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    restored_by: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_utenti.id"))
    restored_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerValutazionePersonale(Base):
    """Testata di una sessione di valutazione (§16.6): il salvataggio crea
    sempre una nuova riga, mai un aggiornamento di una precedente."""

    __tablename__ = "per_valutazioni_personale"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))

    macroarea: Mapped[str] = mapped_column(String(20))
    data_valutazione: Mapped[date]
    valutatore_user_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_utenti.id"))
    nota_generale: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerValutazionePersonaleDettaglio(Base):
    """Riga di dettaglio di una valutazione: livello assegnato a una voce
    (condivisa o personale) — esattamente una delle due valorizzata."""

    __tablename__ = "per_valutazioni_personale_dettagli"

    id: Mapped[uuid.UUID] = _id_col()
    valutazione_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("per_valutazioni_personale.id", ondelete="CASCADE")
    )
    voce_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_voci_valutazione_personale.id")
    )
    voce_personale_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("per_voci_valutazione_personali.id")
    )

    livello: Mapped[str] = mapped_column(String(20))
    evidenza_nota: Mapped[str | None] = mapped_column(Text)
    snapshot_nome: Mapped[str | None] = mapped_column(String(200))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatCorsoFormazione(Base):
    """Catalogo dei corsi di formazione, per azienda (§14.4)."""

    __tablename__ = "cat_corsi_formazione"
    __table_args__ = (UniqueConstraint("azienda_id", "codice"),)

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    codice: Mapped[str] = mapped_column(String(80))
    denominazione: Mapped[str] = mapped_column(String(300))
    categoria: Mapped[str | None] = mapped_column(String(200))
    durata_standard_ore: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    validita_mesi: Mapped[int | None]
    soglia_preavviso_giorni: Mapped[int | None]
    obbligatorio: Mapped[bool] = mapped_column(Boolean, default=False)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerFormazione(Base):
    """Formazione acquisita da una persona (§14.5): modello semplice, una
    riga = una persona + un corso completato."""

    __tablename__ = "per_formazione"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))
    corso_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_corsi_formazione.id"))

    tipologia: Mapped[str | None] = mapped_column(String(20))
    data_completamento: Mapped[date]
    ore_riconosciute: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    ente_formatore: Mapped[str] = mapped_column(String(300))
    esito: Mapped[str] = mapped_column(String(20), default="AMMESSO")
    numero_attestato: Mapped[str | None] = mapped_column(String(100))
    scadenza_esplicita: Mapped[date | None]
    regola_scadenza: Mapped[str | None] = mapped_column(String(200))
    documento_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatAbilitazione(Base):
    """Catalogo globale di sistema delle abilitazioni professionali
    (§14.6)."""

    __tablename__ = "cat_abilitazioni"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(80))
    denominazione: Mapped[str] = mapped_column(String(300))
    descrizione: Mapped[str | None] = mapped_column(Text)
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger, default=1)
    soglia_preavviso_giorni: Mapped[int | None]
    obbligatorio: Mapped[bool] = mapped_column(Boolean, default=False)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerAbilitazione(Base):
    """Abilitazione posseduta da una persona (§14.6)."""

    __tablename__ = "per_abilitazioni"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))
    abilitazione_catalogo_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_abilitazioni.id"))

    livello_tipologia: Mapped[str | None] = mapped_column(String(200))
    data_conseguimento: Mapped[date]
    data_scadenza: Mapped[date | None]
    durata_ore: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    documento_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))
    note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatTipoVisita(Base):
    """Catalogo globale di sistema delle tipologie di visita di
    sorveglianza sanitaria (estensione "Idoneità sanitaria"): terminologia
    standard di medicina del lavoro, condivisa tra tutte le aziende —
    sostituisce la colonna testuale libera decisa dalla migrazione 014,
    quando nessun catalogo esisteva ancora."""

    __tablename__ = "cat_tipi_visita"

    id: Mapped[uuid.UUID] = _id_col()
    codice: Mapped[str] = mapped_column(String(80))
    denominazione: Mapped[str] = mapped_column(String(300))
    ordine_visualizzazione: Mapped[int] = mapped_column(SmallInteger, default=1)
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerGiudizioIdoneita(Base):
    """Giudizio di idoneità sanitaria (§15.1): principio di
    minimizzazione, nessuna diagnosi o referto clinico completo."""

    __tablename__ = "per_giudizi_idoneita"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))

    tipo_visita_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_tipi_visita.id"))
    data_visita: Mapped[date]
    giudizio: Mapped[str] = mapped_column(String(30))
    periodicita_mesi: Mapped[int | None]
    data_scadenza: Mapped[date | None]
    medico_competente: Mapped[str | None] = mapped_column(String(300))
    prescrizioni_minime: Mapped[str | None] = mapped_column(Text)
    documento_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerTitoloStudio(Base):
    """Titolo di studio di una persona (§17.1). Riusa il catalogo globale
    esistente `cat_tipologie_titoli_studio`.

    Nome tabella `per_titoli_studio_persona`, non `per_titoli_studio`:
    quel nome è già occupato da un placeholder minimo creato dalla
    baseline (`0001_baseline_schema.py`), segnalato esplicitamente in
    CLAUDE.md e doc/AMBIENTE-SVILUPPO.md come "catalogo titoli di studio
    da popolare/estendere" — un concetto diverso (catalogo, non
    registrazione per persona) e comunque sovrapposto a
    `cat_tipologie_titoli_studio`, che è il catalogo reale già in uso."""

    __tablename__ = "per_titoli_studio_persona"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))
    tipologia_titolo_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_tipologie_titoli_studio.id")
    )

    indirizzo_specializzazione: Mapped[str | None] = mapped_column(String(300))
    istituto: Mapped[str | None] = mapped_column(String(300))
    anno: Mapped[int | None] = mapped_column(SmallInteger)
    votazione: Mapped[str | None] = mapped_column(String(50))
    documento_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerEsperienza(Base):
    """Esperienza rilevante di una persona (§17.2). Non è un rapporto
    aziendale corrente e non modifica mansione o ruoli."""

    __tablename__ = "per_esperienze"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))

    attivita_ruolo: Mapped[str] = mapped_column(String(300))
    organizzazione: Mapped[str | None] = mapped_column(String(300))
    data_inizio: Mapped[date | None]
    data_fine: Mapped[date | None]
    rilevanza: Mapped[str] = mapped_column(String(20))
    verificata: Mapped[bool] = mapped_column(Boolean, default=False)
    descrizione: Mapped[str | None] = mapped_column(Text)
    documento_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerNota(Base):
    """Nota o annotazione contestuale su una persona (§18): nessun effetto
    automatico su scadenze, attività o registrazioni."""

    __tablename__ = "per_note"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))

    categoria: Mapped[str] = mapped_column(String(30), default="GENERALE")
    titolo: Mapped[str | None] = mapped_column(String(200))
    testo: Mapped[str] = mapped_column(Text)
    visibilita: Mapped[str] = mapped_column(String(30), default="CONDIVISA_AZIENDA")
    in_evidenza: Mapped[bool] = mapped_column(Boolean, default=False)
    autore_user_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_utenti.id"))
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PerAttivita(Base):
    """Attività pianificata manualmente (§20): corsi da organizzare,
    visite da pianificare, promemoria. Le scadenze derivate da
    registrazioni esistenti non vengono duplicate qui."""

    __tablename__ = "per_attivita"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))

    tipo: Mapped[str] = mapped_column(String(50))
    categoria: Mapped[str | None] = mapped_column(String(50))
    titolo: Mapped[str] = mapped_column(String(300))
    data_scadenza: Mapped[date]
    ora: Mapped[time | None] = mapped_column(Time)
    stato: Mapped[str] = mapped_column(String(20), default="PIANIFICATA")
    responsabile_user_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_utenti.id"))
    source_type: Mapped[str | None] = mapped_column(String(50))
    source_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))
    note: Mapped[str | None] = mapped_column(Text)
    medico_competente: Mapped[str | None] = mapped_column(String(300))
    luogo: Mapped[str | None] = mapped_column(String(300))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatTipoDocumentoIdentita(Base):
    """Catalogo di sistema delle tipologie di documento personale (Dossier
    personale > Documenti personali, migrazione 019). Include il permesso
    di soggiorno come tipologia tra le altre (§5.4 della correzione), non
    più uno stato a parte su AnaPersone."""

    __tablename__ = "cat_tipi_documento_identita"

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


class PerDocumentoPersonale(Base):
    """Documento personale di una persona (Dossier personale > Documenti
    personali, migrazione 019): un numero non limitato di righe per
    persona, anche di tipologie ripetute. Sostituisce le colonne singole
    aggiunte ad AnaPersone dalla migrazione 018. Nessun collegamento ad
    allegati reali finché il modulo Documenti non sarà costruito
    (decisione utente esplicita: solo il conteggio, sempre 0 per ora)."""

    __tablename__ = "per_documenti_personali"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id", ondelete="CASCADE"))
    tipo_documento_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_tipi_documento_identita.id")
    )

    numero: Mapped[str | None] = mapped_column(String(100))
    data_rilascio: Mapped[date | None]
    data_scadenza: Mapped[date | None]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
