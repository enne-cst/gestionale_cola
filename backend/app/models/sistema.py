import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
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
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))
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
