"""Paginazione server-side condivisa.

Non esisteva alcun pattern di paginazione nel repository prima del modulo
Personale (ogni elenco esistente restituisce l'intero set azienda-scoped,
es. `app.crud.generic.register_list_crud`): introdotta qui perché il
modulo Personale la richiede esplicitamente su più viste (Persone,
Formazione, matrice di Monitoraggio, Scadenziario) e reinventarla ad ogni
endpoint duplicherebbe la stessa logica di conteggio/slice.
"""

from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

T = TypeVar("T")


class PageParams:
    def __init__(
        self,
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=100),
    ) -> None:
        self.page = page
        self.page_size = page_size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


def paginate(db: Session, stmt: Select, params: PageParams) -> tuple[list, int]:
    """Esegue `stmt` con LIMIT/OFFSET e conta il totale non paginato in una
    seconda query — non c'è modo di ottenere entrambi in una sola query
    portabile con SQLAlchemy Core, e il volume per azienda non giustifica
    un'ottimizzazione più complessa (window function) finché non misurato."""

    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = db.scalars(stmt.limit(params.page_size).offset(params.offset)).all()
    return list(rows), total
