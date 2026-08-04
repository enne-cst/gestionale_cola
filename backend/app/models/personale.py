import uuid
from datetime import date, datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Persona(Base):
    """Anagrafica minima di una persona fisica collegata all'azienda.

    Il modulo Personale completo (ruoli, incarichi, formazione, DPI...) non è
    ancora sviluppato: questa tabella esiste già a schema ed è qui esposta
    solo nella misura necessaria a selezionare/creare il nominativo da
    collegare alle qualifiche dell'Anagrafica Aziendale (soci, amministratori,
    sindaci, ecc.).
    """

    __tablename__ = "per_persone"
    __table_args__ = (UniqueConstraint("azienda_id", "codice_fiscale"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))

    categoria: Mapped[str] = mapped_column(String(50))

    nominativo: Mapped[str] = mapped_column(String(255))
    codice_fiscale: Mapped[str | None] = mapped_column(String(16))

    data_nascita: Mapped[date | None]
    comune_nascita: Mapped[str | None] = mapped_column(String(150))
    provincia_nascita: Mapped[str | None] = mapped_column(String(5))

    comune_domicilio: Mapped[str | None] = mapped_column(String(150))
    provincia_domicilio: Mapped[str | None] = mapped_column(String(5))
    indirizzo_domicilio: Mapped[str | None] = mapped_column(String(255))
    cap_domicilio: Mapped[str | None] = mapped_column(String(10))
    frazione_domicilio: Mapped[str | None] = mapped_column(String(150))

    pec: Mapped[str | None] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
