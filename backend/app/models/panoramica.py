"""Modello SQLAlchemy per la configurazione della scheda Panoramica.

Trasversale ai moduli applicativi: mappa `sys_panoramica_voci`, che non
appartiene a un singolo modulo (vedi commento nel file .sql sorgente).

Una voce identifica *o* un campo di una sezione singleton (`campo`
valorizzato, `record_id` nullo) *o* un intero record di una sezione a
elenco (`record_id` valorizzato, `campo` nullo) — mai entrambi, mai
nessuno dei due (vedi validazione in app.schemas.panoramica).
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PanoramicaVoce(Base):
    __tablename__ = "sys_panoramica_voci"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    azienda_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("sys_aziende.id"))

    modulo: Mapped[str] = mapped_column(String(150))
    sezione_slug: Mapped[str] = mapped_column(String(150))
    campo: Mapped[str | None] = mapped_column(String(150))
    record_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True))
    etichetta: Mapped[str] = mapped_column(String(255))
    ordine: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
