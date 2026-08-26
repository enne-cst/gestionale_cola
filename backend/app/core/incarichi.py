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

from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext
from app.core.registro_campi import STATO_API_TO_DB, STATO_DB_TO_API, registra_audit
from app.models.personale import CatCaratteristicaIncarico, PerIncarico, PerIncaricoValore, RelRuoloCaratteristica
from app.models.sistema import SysRegistroStatoCampi, SysUtente
from app.schemas.registro_campi import VerificationStatus

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


# ===========================================================================
# Verifica del consulente sulla riga-incarico (Soci/Amministratori/Sindaci)
# ===========================================================================
#
# Prima di questa aggiunta lo stato di verifica viveva nella caratteristica
# condivisa A32 ("Stato verifica consulente"), modificabile solo dentro il
# form di compilazione dell'incarico — un semplice valore di catalogo, senza
# nota persistita, audit o concorrenza ottimistica. L'utente ha chiesto che
# la riga abbia lo stesso trattamento di "qualsiasi altra informazione" del
# registro campo-per-campo (popup ancorato, nota, verificato da/il,
# conflitto di concorrenza) e che non sia più editabile dal form.
#
# Riusa direttamente `sys_registro_stato_campi`/`sys_registro_audit`
# (già generiche per `sezione_codice`/`campo_codice`, vedi
# `app.core.registro_campi`) invece di introdurre uno schema parallelo: un
# incarico è trattato come un "campo" a sé, `campo_codice` = id dell'incarico.
# Un solo `sezione_codice` condiviso perché Soci/Amministratori/Sindaci sono
# la stessa entità di dominio (un incarico), non tre cataloghi diversi.
SEZIONE_CODICE_VERIFICA_INCARICHI = "ANAGRAFICA_AZIENDALE.INCARICHI"


def _campo_codice(incarico_id: UUID) -> str:
    return str(incarico_id)


def _stato_riga(db: Session, azienda_id: UUID, incarico_id: UUID) -> SysRegistroStatoCampi | None:
    return db.scalars(
        select(SysRegistroStatoCampi).where(
            SysRegistroStatoCampi.azienda_id == azienda_id,
            SysRegistroStatoCampi.sezione_codice == SEZIONE_CODICE_VERIFICA_INCARICHI,
            SysRegistroStatoCampi.campo_codice == _campo_codice(incarico_id),
        )
    ).first()


def leggi_stato_verifica_incarico(db: Session, azienda_id: UUID, incarico_id: UUID) -> dict[str, Any]:
    """Un incarico esistente non è mai "vuoto" (a differenza di un campo del
    registro): senza riga di stato è semplicemente non ancora toccato dal
    meccanismo, quindi DA_VERIFICARE con versione 1 — stessa convenzione di
    backfill "pigro" già in uso per i campi legacy compilati senza stato."""
    riga = _stato_riga(db, azienda_id, incarico_id)
    if riga is None:
        return {"status": "PENDING_VERIFICATION", "version": 1, "note": None, "verified_at": None, "verified_by": None}
    stato: VerificationStatus = STATO_DB_TO_API.get(riga.stato_verifica_codice) or "PENDING_VERIFICATION"
    verificato_il = riga.verificato_at.isoformat() if stato == "VERIFIED" and riga.verificato_at is not None else None
    verificato_da_nome = None
    if stato == "VERIFIED" and riga.verificato_da is not None:
        utente = db.get(SysUtente, riga.verificato_da)
        if utente is not None:
            verificato_da_nome = f"{utente.nome} {utente.cognome[:1]}."
    return {
        "status": stato,
        "version": riga.versione,
        "note": riga.nota_revisione,
        "verified_at": verificato_il,
        "verified_by": verificato_da_nome,
    }


def applica_decisione_verifica_incarico(
    db: Session,
    ctx: AziendaContext,
    incarico_id: UUID,
    *,
    decisione: str,
    nota: str | None,
    expected_version: int | None,
) -> None:
    """Stessa logica di transizione di `registro_campi.applica_decisione_verifica`,
    senza il concetto di "valore vuoto" (un incarico esiste sempre) e senza
    dipendere da un catalogo di campi statico."""
    if decisione == "REVISION_REQUIRED" and (nota is None or nota.strip() == ""):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "La richiesta di revisione richiede una nota che spieghi cosa correggere",
        )

    campo = _campo_codice(incarico_id)
    stato_riga = _stato_riga(db, ctx.azienda_id, incarico_id)
    if stato_riga is None:
        stato_riga = SysRegistroStatoCampi(
            azienda_id=ctx.azienda_id,
            sezione_codice=SEZIONE_CODICE_VERIFICA_INCARICHI,
            campo_codice=campo,
            versione=1,
        )
        db.add(stato_riga)

    if expected_version is not None and stato_riga.versione != expected_version:
        raise HTTPException(status.HTTP_409_CONFLICT, "L'incarico è stato modificato nel frattempo: ricaricare e riprovare")

    codice_db = STATO_API_TO_DB[decisione]
    # Un incarico già confermato che riceve di nuovo VERIFIED (pulsante
    # "Salva nota") aggiorna solo la nota, non la data/autore di verifica —
    # stessa regola di `applica_decisione_verifica`.
    solo_nota = decisione == "VERIFIED" and stato_riga.stato_verifica_codice == "APPROVATO"
    stato_riga.stato_verifica_codice = codice_db
    stato_riga.versione += 1
    stato_riga.nota_revisione = nota
    if decisione == "REVISION_REQUIRED":
        stato_riga.verificato_da = None
        stato_riga.verificato_at = None
        azione = "RICHIESTA_REVISIONE"
    elif solo_nota:
        azione = "VERIFICA"
    else:
        stato_riga.verificato_da = ctx.utente_id
        stato_riga.verificato_at = datetime.now(timezone.utc)
        azione = "VERIFICA"

    registra_audit(
        db,
        ctx,
        sezione_codice=SEZIONE_CODICE_VERIFICA_INCARICHI,
        campo_codice=campo,
        azione=azione,
        precedente=None,
        nuovo=nota,
    )
