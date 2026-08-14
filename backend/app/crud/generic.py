"""Fabbrica di endpoint CRUD azienda-scoped, riutilizzata da tutte le
sotto-risorse dell'Anagrafica Aziendale che non richiedono logica su misura
(niente relazioni figlie da gestire in transazione).

Ogni endpoint generato:
  - filtra sempre per `azienda_id` lato server (mai un id ricevuto dal
    client senza verifica — isolamento dati tra aziende, doc. cap. 2.3.12);
  - richiede che il modulo indicato sia abilitato per l'azienda corrente
    (motore di configurazione, doc. cap. 3.1.8);
  - se `sezione` è indicato, richiede anche che quella specifica sezione sia
    abilitata dall'abbonamento (motore più fine, `app.core.sezioni`, doc.
    cap. 4.1 punto 013) — usato dalle sotto-risorse soggette a
    certificazione, es. le sezioni ISO 9001;
  - usa `exclude_unset` sugli aggiornamenti, per supportare la compilazione
    progressiva dei dati tipica del modello operativo descritto nel
    documento (l'azienda compila una sezione alla volta, non l'intero
    record in un colpo solo).

Avere un'unica implementazione qui, invece di ripeterla per ciascuna delle
sotto-risorse, è un'applicazione diretta dei principi di riutilizzabilità e
"configurazione al posto della duplicazione" (doc. cap. 2.3.6-2.3.7).
"""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.moduli import require_modulo
from app.core.sezioni import require_sezione
from app.database import Base, get_db


def _noop_dependency() -> None:
    """Dependency FastAPI vuota, usata al posto di `require_sezione` quando
    una sotto-risorsa non è soggetta a nessuna sezione (nessun controllo
    aggiuntivo oltre a `require_modulo`)."""
    return None


def _sezione_dependency(sezione: str | None):
    return require_sezione(sezione) if sezione is not None else _noop_dependency


def _get_owned_or_404(db: Session, model: type[Base], item_id: UUID, azienda_id: UUID) -> Any:
    obj = db.get(model, item_id)
    if obj is None or obj.azienda_id != azienda_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risorsa non trovata")
    return obj


def register_list_crud(
    router: APIRouter,
    *,
    path: str,
    tags: list[str],
    modulo: str,
    model: type[Base],
    read_schema: type[BaseModel],
    create_schema: type[BaseModel],
    update_schema: type[BaseModel],
    sezione: str | None = None,
    read_model: type[Base] | None = None,
) -> None:
    """Registra list/create/get/update/delete per un'entità con più record
    per azienda (es. sedi, contatti, soci).

    `read_model`, se indicato, sostituisce `model` solo nelle letture
    (list/get): usato dalle sezioni che espongono anche valori derivati
    tramite una vista SQL (es. percentuali calcolate), per non duplicare nel
    backend un calcolo già fatto dal database."""

    modulo_dep = require_modulo(modulo)
    sezione_dep = _sezione_dependency(sezione)
    query_model = read_model or model

    @router.get(path, response_model=list[read_schema], tags=tags)
    def list_items(
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        stmt = select(query_model).where(query_model.azienda_id == ctx.azienda_id).order_by(query_model.created_at)
        return db.scalars(stmt).all()

    @router.post(path, response_model=read_schema, status_code=status.HTTP_201_CREATED, tags=tags)
    def create_item(
        payload: create_schema,
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        obj = model(azienda_id=ctx.azienda_id, **payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return _get_owned_or_404(db, query_model, obj.id, ctx.azienda_id)

    @router.get(f"{path}/{{item_id}}", response_model=read_schema, tags=tags)
    def get_item(
        item_id: UUID,
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        return _get_owned_or_404(db, query_model, item_id, ctx.azienda_id)

    @router.put(f"{path}/{{item_id}}", response_model=read_schema, tags=tags)
    def update_item(
        item_id: UUID,
        payload: update_schema,
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        obj = _get_owned_or_404(db, model, item_id, ctx.azienda_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return _get_owned_or_404(db, query_model, item_id, ctx.azienda_id)

    @router.delete(f"{path}/{{item_id}}", status_code=status.HTTP_204_NO_CONTENT, tags=tags)
    def delete_item(
        item_id: UUID,
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        obj = _get_owned_or_404(db, model, item_id, ctx.azienda_id)
        db.delete(obj)
        db.commit()


def register_singleton_crud(
    router: APIRouter,
    *,
    path: str,
    tags: list[str],
    modulo: str,
    model: type[Base],
    read_schema: type[BaseModel],
    upsert_schema: type[BaseModel],
    sezione: str | None = None,
    read_model: type[Base] | None = None,
) -> None:
    """Registra get/put per un'entità con un solo record per azienda (es.
    identificazione camerale, capitale sociale). Il PUT crea il record se
    non esiste ancora, altrimenti applica solo i campi inviati.

    Vedi `register_list_crud` per il significato di `sezione` e
    `read_model`."""

    modulo_dep = require_modulo(modulo)
    sezione_dep = _sezione_dependency(sezione)
    query_model = read_model or model

    @router.get(path, response_model=read_schema | None, tags=tags)
    def get_singleton(
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        stmt = select(query_model).where(query_model.azienda_id == ctx.azienda_id)
        return db.scalars(stmt).first()

    @router.put(path, response_model=read_schema, tags=tags)
    def upsert_singleton(
        payload: upsert_schema,
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        stmt = select(model).where(model.azienda_id == ctx.azienda_id)
        obj = db.scalars(stmt).first()
        data = payload.model_dump(exclude_unset=True)
        if obj is None:
            obj = model(azienda_id=ctx.azienda_id, **payload.model_dump())
            db.add(obj)
        else:
            for field, value in data.items():
                setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        stmt_query = select(query_model).where(query_model.azienda_id == ctx.azienda_id)
        return db.scalars(stmt_query).first()


def _row_to_dict(obj: Any) -> dict[str, Any]:
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


def _read_with_children(
    db: Session,
    obj: Any,
    *,
    child_model: type[Base],
    child_fk_field: str,
    children_attr: str,
    child_read_schema: type[BaseModel],
    read_schema: type[BaseModel],
) -> BaseModel:
    children = db.scalars(
        select(child_model).where(getattr(child_model, child_fk_field) == obj.id).order_by(child_model.created_at)
    ).all()
    data = _row_to_dict(obj)
    data[children_attr] = [child_read_schema.model_validate(c) for c in children]
    return read_schema.model_validate(data)


def _replace_children(
    db: Session, parent_id: UUID, items: list[BaseModel], *, child_model: type[Base], child_fk_field: str
) -> None:
    db.execute(delete(child_model).where(getattr(child_model, child_fk_field) == parent_id))
    for item in items:
        db.add(child_model(**{child_fk_field: parent_id}, **item.model_dump()))


def register_list_crud_with_children(
    router: APIRouter,
    *,
    path: str,
    tags: list[str],
    modulo: str,
    model: type[Base],
    read_schema: type[BaseModel],
    create_schema: type[BaseModel],
    update_schema: type[BaseModel],
    child_model: type[Base],
    child_fk_field: str,
    children_attr: str,
    child_read_schema: type[BaseModel],
    sezione: str | None = None,
) -> None:
    """Come `register_list_crud`, ma per entità che portano con sé una lista
    di record figli gestiti nella stessa transazione (es. attestazione SOA +
    categorie, certificazione + settori IAF, rilevazione addetti + periodi).
    In creazione/aggiornamento i figli inviati sostituiscono integralmente
    quelli esistenti (l'operazione composita è atomica, doc. cap. 2.3.15);
    se il campo dei figli non è presente nella richiesta, quelli esistenti
    non vengono toccati. Vedi `register_list_crud` per `sezione`."""

    modulo_dep = require_modulo(modulo)
    sezione_dep = _sezione_dependency(sezione)

    def _read(db: Session, obj: Any) -> BaseModel:
        return _read_with_children(
            db,
            obj,
            child_model=child_model,
            child_fk_field=child_fk_field,
            children_attr=children_attr,
            child_read_schema=child_read_schema,
            read_schema=read_schema,
        )

    def _replace(db: Session, parent_id: UUID, items: list[BaseModel]) -> None:
        _replace_children(db, parent_id, items, child_model=child_model, child_fk_field=child_fk_field)

    @router.get(path, response_model=list[read_schema], tags=tags)
    def list_items(
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        objs = db.scalars(select(model).where(model.azienda_id == ctx.azienda_id).order_by(model.created_at)).all()
        return [_read(db, o) for o in objs]

    @router.post(path, response_model=read_schema, status_code=status.HTTP_201_CREATED, tags=tags)
    def create_item(
        payload: create_schema,
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        children = getattr(payload, children_attr)
        data = payload.model_dump(exclude={children_attr})
        obj = model(azienda_id=ctx.azienda_id, **data)
        db.add(obj)
        db.flush()
        _replace(db, obj.id, children)
        db.commit()
        db.refresh(obj)
        return _read(db, obj)

    @router.get(f"{path}/{{item_id}}", response_model=read_schema, tags=tags)
    def get_item(
        item_id: UUID,
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        obj = _get_owned_or_404(db, model, item_id, ctx.azienda_id)
        return _read(db, obj)

    @router.put(f"{path}/{{item_id}}", response_model=read_schema, tags=tags)
    def update_item(
        item_id: UUID,
        payload: update_schema,
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        obj = _get_owned_or_404(db, model, item_id, ctx.azienda_id)
        data = payload.model_dump(exclude_unset=True, exclude={children_attr})
        for field, value in data.items():
            setattr(obj, field, value)
        children = getattr(payload, children_attr, None)
        if children is not None:
            _replace(db, obj.id, children)
        db.commit()
        db.refresh(obj)
        return _read(db, obj)

    @router.delete(f"{path}/{{item_id}}", status_code=status.HTTP_204_NO_CONTENT, tags=tags)
    def delete_item(
        item_id: UUID,
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        obj = _get_owned_or_404(db, model, item_id, ctx.azienda_id)
        db.delete(obj)  # i figli seguono via ON DELETE CASCADE lato database
        db.commit()


def register_singleton_crud_with_children(
    router: APIRouter,
    *,
    path: str,
    tags: list[str],
    modulo: str,
    model: type[Base],
    read_schema: type[BaseModel],
    upsert_schema: type[BaseModel],
    child_model: type[Base],
    child_fk_field: str,
    children_attr: str,
    child_read_schema: type[BaseModel],
    sezione: str | None = None,
) -> None:
    """Variante singleton di `register_list_crud_with_children` (es.
    amministrazione e controllo + sistemi di amministrazione). Vedi
    `register_list_crud` per `sezione`."""

    modulo_dep = require_modulo(modulo)
    sezione_dep = _sezione_dependency(sezione)

    def _read(db: Session, obj: Any) -> BaseModel:
        return _read_with_children(
            db,
            obj,
            child_model=child_model,
            child_fk_field=child_fk_field,
            children_attr=children_attr,
            child_read_schema=child_read_schema,
            read_schema=read_schema,
        )

    def _replace(db: Session, parent_id: UUID, items: list[BaseModel]) -> None:
        _replace_children(db, parent_id, items, child_model=child_model, child_fk_field=child_fk_field)

    @router.get(path, response_model=read_schema | None, tags=tags)
    def get_singleton(
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        obj = db.scalars(select(model).where(model.azienda_id == ctx.azienda_id)).first()
        return _read(db, obj) if obj is not None else None

    @router.put(path, response_model=read_schema, tags=tags)
    def upsert_singleton(
        payload: upsert_schema,
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
        _modulo: None = Depends(modulo_dep),
        _sezione: None = Depends(sezione_dep),
    ):
        obj = db.scalars(select(model).where(model.azienda_id == ctx.azienda_id)).first()
        data = payload.model_dump(exclude_unset=True, exclude={children_attr})
        if obj is None:
            obj = model(azienda_id=ctx.azienda_id, **data)
            db.add(obj)
        else:
            for field, value in data.items():
                setattr(obj, field, value)
        db.flush()
        children = getattr(payload, children_attr, None)
        if children is not None:
            _replace(db, obj.id, children)
        db.commit()
        db.refresh(obj)
        return _read(db, obj)
