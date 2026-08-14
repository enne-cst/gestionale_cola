import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, ForeignKeyConstraint, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SysProfilo(Base):
    __tablename__ = "sys_profili"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codice: Mapped[str] = mapped_column(String(50), unique=True)
    nome: Mapped[str] = mapped_column(String(100))
    descrizione: Mapped[str | None]
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SysAzienda(Base):
    __tablename__ = "sys_aziende"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ragione_sociale: Mapped[str] = mapped_column(String(255))
    partita_iva: Mapped[str | None] = mapped_column(String(11))
    codice_fiscale: Mapped[str | None] = mapped_column(String(16))
    email_registrazione: Mapped[str] = mapped_column(String(255), unique=True)
    # 'in_attesa' (default) | 'approvata' | 'rifiutata' — le aziende create
    # da un consulente restano in attesa finché un super admin non le
    # approva (vedi migrazione 0006 e app/api/auth.py).
    stato_approvazione: Mapped[str] = mapped_column(String(20), default="in_attesa")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SysUtente(Base):
    __tablename__ = "sys_utenti"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(100))
    cognome: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str]
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verificata: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RelUtenteAzienda(Base):
    __tablename__ = "rel_utenti_aziende"
    __table_args__ = (UniqueConstraint("utente_id", "azienda_id"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    utente_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_utenti.id"))
    # Nullable: un consulente (o un super admin) non è legato a una singola
    # azienda, a differenza di un admin/operatore aziendale.
    azienda_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))
    profilo_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_profili.id"))
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatSettoreIAF(Base):
    __tablename__ = "cat_settori_iaf"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(100), unique=True)
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RelAziendaSettoreIAF(Base):
    __tablename__ = "rel_aziende_settori_iaf"
    __table_args__ = (UniqueConstraint("azienda_id", "settore_iaf_id"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))
    settore_iaf_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_settori_iaf.id"))


class CatCertificazione(Base):
    __tablename__ = "cat_certificazioni"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(100), unique=True)
    # Identificatore stabile (es. 'ISO_9001'), usato da sys_elementi per
    # collegare sezioni/campi alle certificazioni senza dipendere dal nome
    # visualizzato (vedi migrazione 019_cat_codici.sql).
    codice: Mapped[str] = mapped_column(String(50), unique=True)
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatStatoCertificazione(Base):
    __tablename__ = "cat_stati_certificazione"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(50), unique=True)
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SysAziendaCertificazione(Base):
    __tablename__ = "sys_aziende_certificazioni"
    __table_args__ = (UniqueConstraint("azienda_id", "certificazione_id"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))
    certificazione_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_certificazioni.id")
    )
    stato_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_stati_certificazione.id"))
    data_attivazione: Mapped[date]
    data_scadenza: Mapped[date]
    rinnovo_automatico: Mapped[bool] = mapped_column(Boolean, default=True)
    data_disattivazione: Mapped[date | None]
    data_cancellazione_prevista: Mapped[date | None]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CatModulo(Base):
    __tablename__ = "cat_moduli"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(100), unique=True)
    # Identificatore stabile (es. 'ANAGRAFICA_AZIENDALE'), vedi commento
    # analogo su CatCertificazione.codice.
    codice: Mapped[str] = mapped_column(String(50), unique=True)
    attiva: Mapped[bool] = mapped_column(Boolean, default=True)
    base: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CfgModulo(Base):
    __tablename__ = "cfg_moduli"
    __table_args__ = (UniqueConstraint("settore_iaf_id", "certificazione_id", "modulo_id"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    settore_iaf_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_settori_iaf.id"))
    certificazione_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_certificazioni.id")
    )
    modulo_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_moduli.id"))


class SysElemento(Base):
    """Catalogo gerarchico delle sezioni/campi soggetti ad abbonamento (doc.
    cap. 4.1 punto 013). Radice di ogni sotto-albero: `elemento_padre_id` è
    NULL. Vedi anche `RelElementoCertificazione`."""

    __tablename__ = "sys_elementi"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codice: Mapped[str] = mapped_column(String(200), unique=True)
    modulo_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_moduli.id"))
    elemento_padre_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_elementi.id"))
    # 'SEZIONE' o 'CAMPO'.
    tipo_elemento: Mapped[str] = mapped_column(String(20))
    denominazione: Mapped[str] = mapped_column(String(255))
    # Testo mostrato dal pulsante informativo dell'interfaccia.
    descrizione: Mapped[str | None]
    schema_database: Mapped[str] = mapped_column(String(50), default="public")
    nome_tabella: Mapped[str | None] = mapped_column(String(100))
    nome_colonna: Mapped[str | None] = mapped_column(String(100))
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RelElementoCertificazione(Base):
    """Certificazioni che sbloccano un elemento del catalogo. Più righe per
    lo stesso elemento = semantica OR (basta una certificazione attiva tra
    quelle elencate, vedi `app.core.sezioni.get_sezioni_abilitate`)."""

    __tablename__ = "rel_elementi_certificazioni"
    __table_args__ = (UniqueConstraint("elemento_id", "certificazione_id"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elemento_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_elementi.id"))
    certificazione_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("cat_certificazioni.id")
    )
    tutti_settori_iaf: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RelElementoCertificazioneSettoreIAF(Base):
    """Restringe a specifici settori IAF una riga di
    `RelElementoCertificazione` con `tutti_settori_iaf = False`. Nessuna
    delle sezioni ISO 9001 attuali la usa (associate a tutti i settori), ma
    la tabella esiste già per i moduli futuri che ne avranno bisogno."""

    __tablename__ = "rel_elementi_certificazioni_settori_iaf"
    __table_args__ = (
        UniqueConstraint("elemento_id", "certificazione_id", "settore_iaf_id"),
        ForeignKeyConstraint(
            ["elemento_id", "certificazione_id"],
            ["rel_elementi_certificazioni.elemento_id", "rel_elementi_certificazioni.certificazione_id"],
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elemento_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True))
    certificazione_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True))
    settore_iaf_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("cat_settori_iaf.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CatStatoVerificaModifiche(Base):
    """Stati possibili della verifica di una modifica in
    `SysPresaVisioneModifiche` (DA_VERIFICARE, APPROVATO, IN_REVISIONE)."""

    __tablename__ = "cat_stati_verifica_modifiche"

    codice: Mapped[str] = mapped_column(String(30), primary_key=True)
    denominazione: Mapped[str] = mapped_column(String(100))
    ordine_visualizzazione: Mapped[int]
    attivo: Mapped[bool] = mapped_column(Boolean, default=True)


class SysPresaVisioneModifiche(Base):
    """Traccia, per singolo utente incaricato (solo profilo CONSULENTE) e
    singolo record di un'altra tabella (`entita`/`record_id`, riferimento
    polimorfico non vincolato da FK), lo stato di verifica dell'ultima
    modifica rilevata. Nessuna entità è collegata a questo meccanismo in
    questo intervento (vedi migrazione 0010): la tabella è pronta per essere
    usata dai moduli futuri.

    Modello di storicizzazione: nessuno storico delle verifiche passate
    ("reset atomico", decisione utente 2026-08-14) — una nuova modifica allo
    stesso record aggiorna la riga esistente invece di crearne una nuova, si
    veda `app.services.verifica_modifiche.apri_o_riapri_verifica`."""

    __tablename__ = "sys_presa_visione_modifiche"
    __table_args__ = (UniqueConstraint("utente_id", "entita", "record_id"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))
    utente_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_utenti.id"))

    entita: Mapped[str] = mapped_column(String(100))
    record_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True))

    # Momento in cui nasce la modifica da verificare (creazione o riapertura
    # della riga). Distinto da `created_at`, che è tecnico e non cambia mai
    # in seguito a un reset atomico.
    modifica_rilevata_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Valorizzato solo alla prima apertura da parte dell'utente incaricato.
    modifica_vista_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Valorizzato solo dall'azione esplicita di conferma.
    presa_visione_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    stato_verifica_codice: Mapped[str] = mapped_column(
        String(30), ForeignKey("cat_stati_verifica_modifiche.codice"), default="DA_VERIFICARE"
    )
    nota_verifica: Mapped[str | None] = mapped_column(Text)
    stato_verifica_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
