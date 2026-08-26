import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, SmallInteger, String, Text, UniqueConstraint, func
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
    residenza: Mapped[str | None] = mapped_column(Text)

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
    qui)."""

    __tablename__ = "per_incarichi"

    id: Mapped[uuid.UUID] = _id_col()
    azienda_id: Mapped[uuid.UUID] = _azienda_fk()
    persona_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("ana_persone.id"))
    ruolo_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_ruoli.id"))
    note: Mapped[str | None] = mapped_column(Text)

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
