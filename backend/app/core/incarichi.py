"""Motore generico "incarico" = persona + ruolo + caratteristiche.

Sostituisce le tabelle `qual_*` (rimosse): un incarico è la relazione
persona-ruolo (`PerIncarico`); i valori delle caratteristiche richieste dal
ruolo vivono in `PerIncaricoValore`, una riga per caratteristica, nella
colonna tipizzata corrispondente a `CatCaratteristicaIncarico.tipo_dato`.

L'obbligatorietà delle caratteristiche per ruolo è letta da
`RelRuoloCaratteristica` (non è un vincolo del catalogo caratteristiche, che
è condiviso tra tutti i ruoli). Solo `OBBLIGATORIA` è verificata qui in
creazione; `CONDIZIONALE` non ha una regola strutturata da valutare
automaticamente (il campo `condizione` è testo libero descrittivo, cfr.
commento nella migrazione Cataloghi/004) e `FACOLTATIVA` non è mai
obbligatoria.

Cessare un incarico (persona che lascia il ruolo) è un aggiornamento della
stessa riga (tipicamente le caratteristiche A02 "Data cessazione" e A25
"Stato dell'incarico"), non un DELETE: la storicizzazione di più mandati
della stessa persona nello stesso ruolo è ottenuta con più righe
`PerIncarico` distinte (nessun vincolo di unicità persona+ruolo), ciascuna
con le proprie date. Il DELETE dell'endpoint è riservato alla correzione di
un inserimento errato.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.personale import CatCaratteristicaIncarico, PerIncarico, PerIncaricoValore, RelRuoloCaratteristica

_COLONNE_VALORE = (
    "valore_testo",
    "valore_numero",
    "valore_data",
    "valore_booleano",
    "valore_documento_id",
    "valore_multiplo",
)

_TIPO_COLONNA = {
    "TESTO": "valore_testo",
    "TESTO_LUNGO": "valore_testo",
    "CATALOGO": "valore_testo",
    "NUMERO": "valore_numero",
    "DATA": "valore_data",
    "BOOLEANO": "valore_booleano",
    "DOCUMENTO": "valore_documento_id",
    "CATALOGO_MULTIPLO": "valore_multiplo",
}


def _coerce_valore(caratteristica: CatCaratteristicaIncarico, raw: Any) -> Any:
    tipo = caratteristica.tipo_dato
    if raw is None:
        return None

    if tipo == "NUMERO":
        try:
            return Decimal(str(raw))
        except (InvalidOperation, ValueError) as exc:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, f"Valore non numerico per '{caratteristica.codice}'"
            ) from exc

    if tipo == "DATA":
        if isinstance(raw, date):
            return raw
        try:
            return date.fromisoformat(str(raw))
        except ValueError as exc:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, f"Data non valida per '{caratteristica.codice}'"
            ) from exc

    if tipo == "BOOLEANO":
        if isinstance(raw, bool):
            return raw
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, f"Valore booleano non valido per '{caratteristica.codice}'"
        )

    if tipo == "DOCUMENTO":
        try:
            return UUID(str(raw))
        except ValueError as exc:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, f"Riferimento documento non valido per '{caratteristica.codice}'"
            ) from exc

    if tipo == "CATALOGO":
        valore = str(raw)
        ammessi = caratteristica.valori_ammessi
        if ammessi and valore not in ammessi:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"Valore '{valore}' non ammesso per '{caratteristica.codice}' (ammessi: {', '.join(ammessi)})",
            )
        return valore

    if tipo == "CATALOGO_MULTIPLO":
        if not isinstance(raw, list):
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, f"Valore multiplo non valido per '{caratteristica.codice}'"
            )
        return raw

    return str(raw)


def configurazione_ruolo(db: Session, ruolo_id: UUID) -> dict[str, tuple[RelRuoloCaratteristica, CatCaratteristicaIncarico]]:
    righe = db.execute(
        select(RelRuoloCaratteristica, CatCaratteristicaIncarico)
        .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == RelRuoloCaratteristica.caratteristica_id)
        .where(RelRuoloCaratteristica.ruolo_id == ruolo_id, RelRuoloCaratteristica.attivo.is_(True))
    ).all()
    return {caratteristica.codice: (rel, caratteristica) for rel, caratteristica in righe}


def valida_e_salva_valori(db: Session, incarico: PerIncarico, valori_input: dict[str, Any], *, parziale: bool) -> None:
    """Valida `valori_input` (chiave = codice caratteristica, es. "A01")
    contro la configurazione del ruolo dell'incarico e salva/aggiorna le
    righe di `PerIncaricoValore` corrispondenti.

    `parziale=False` (creazione): verifica anche che tutte le caratteristiche
    `OBBLIGATORIA` per il ruolo siano presenti in `valori_input`.
    `parziale=True` (aggiornamento): applica solo le chiavi inviate, lascia
    invariate le altre.
    """
    config = configurazione_ruolo(db, incarico.ruolo_id)

    if not parziale:
        mancanti = sorted(
            codice
            for codice, (rel, _car) in config.items()
            if rel.obbligatorieta == "OBBLIGATORIA" and codice not in valori_input
        )
        if mancanti:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"Caratteristiche obbligatorie mancanti per il ruolo: {', '.join(mancanti)}",
            )

    for codice, raw in valori_input.items():
        if codice not in config:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, f"Caratteristica '{codice}' non prevista per questo ruolo"
            )
        _rel, caratteristica = config[codice]
        colonna = _TIPO_COLONNA[caratteristica.tipo_dato]
        valore = _coerce_valore(caratteristica, raw)

        riga = db.scalars(
            select(PerIncaricoValore).where(
                PerIncaricoValore.incarico_id == incarico.id,
                PerIncaricoValore.caratteristica_id == caratteristica.id,
            )
        ).first()
        if riga is None:
            riga = PerIncaricoValore(incarico_id=incarico.id, caratteristica_id=caratteristica.id)
            db.add(riga)
        for col in _COLONNE_VALORE:
            setattr(riga, col, None)
        setattr(riga, colonna, valore)


def leggi_valori(db: Session, incarico_id: UUID) -> dict[str, Any]:
    """Restituisce {codice_caratteristica: valore} per un incarico, leggendo
    la colonna tipizzata corretta di ogni riga in base al tipo_dato."""
    righe = db.execute(
        select(PerIncaricoValore, CatCaratteristicaIncarico)
        .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == PerIncaricoValore.caratteristica_id)
        .where(PerIncaricoValore.incarico_id == incarico_id)
    ).all()
    out: dict[str, Any] = {}
    for valore_riga, caratteristica in righe:
        colonna = _TIPO_COLONNA[caratteristica.tipo_dato]
        out[caratteristica.codice] = getattr(valore_riga, colonna)
    return out
