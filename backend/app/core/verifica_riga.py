"""Verifica del consulente su un record "a riga" (non un singolo campo del
registro campo-per-campo): tratta il record come un "campo" sintetico di
`sys_registro_stato_campi`/`sys_registro_audit` (`campo_codice` = id del
record), stessa tabella e stessa logica di transizione già usate dal
registro campo-per-campo (`app.core.registro_campi.applica_decisione_verifica`).

Generalizzato da `app.core.incarichi` (dove è nato per Soci/Amministratori/
Sindaci, § commento storico in quel modulo) perché qualunque altra tabella
ripetibile con lo stesso bisogno — "conferma un intero record, non un
valore" — deve riusare questo motore invece di introdurne uno parallelo
(richiesta esplicita, § Correzione 20 punto "Non deve essere creato un
secondo sistema di verifica"). Un solo `sezione_codice` per famiglia di
record (es. tutti gli incarichi, tutti i titoli abilitativi): il chiamante
lo fissa una volta e lo passa qui, mai un catalogo di campi statico da
mantenere.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext
from app.core.registro_campi import STATO_API_TO_DB, STATO_DB_TO_API, registra_audit
from app.models.sistema import SysRegistroStatoCampi, SysUtente
from app.schemas.registro_campi import VerificationStatus


def _stato_riga(db: Session, azienda_id: UUID, sezione_codice: str, campo_codice: str) -> SysRegistroStatoCampi | None:
    return db.scalars(
        select(SysRegistroStatoCampi).where(
            SysRegistroStatoCampi.azienda_id == azienda_id,
            SysRegistroStatoCampi.sezione_codice == sezione_codice,
            SysRegistroStatoCampi.campo_codice == campo_codice,
        )
    ).first()


def elimina_stato_verifica_riga(db: Session, azienda_id: UUID, sezione_codice: str, riga_id: UUID) -> None:
    """Da chiamare nella STESSA transazione (prima del commit) di ogni
    cancellazione di un record verificabile per riga (§ richiesta esplicita
    05/09/2026: "eliminando la riga il contatore di Qualità dei dati resta
    invariato, dovrebbe scendere"). `campo_codice` è una colonna generica
    condivisa da tutte le sezioni (non solo quelle "a riga"), quindi non può
    avere una vera FK verso la tabella di dominio: senza questa pulizia
    esplicita la riga di stato del record cancellato resterebbe per sempre,
    contata come "verificata"/"da revisionare" fantasma sia nel totale
    globale sia nei pallini della card (§ operazioni composite = transazione
    unica, CLAUDE.md — mai una pulizia differita o un job a parte)."""
    db.execute(
        delete(SysRegistroStatoCampi).where(
            SysRegistroStatoCampi.azienda_id == azienda_id,
            SysRegistroStatoCampi.sezione_codice == sezione_codice,
            SysRegistroStatoCampi.campo_codice == str(riga_id),
        )
    )


def leggi_stato_verifica_riga(db: Session, azienda_id: UUID, sezione_codice: str, riga_id: UUID) -> dict[str, Any]:
    """Un record esistente non è mai "vuoto" (a differenza di un campo del
    registro): senza riga di stato è semplicemente non ancora toccato dal
    meccanismo, quindi DA_VERIFICARE con versione 1 — stessa convenzione di
    backfill "pigro" già in uso per i campi legacy compilati senza stato."""
    riga = _stato_riga(db, azienda_id, sezione_codice, str(riga_id))
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


def applica_decisione_verifica_riga(
    db: Session,
    ctx: AziendaContext,
    sezione_codice: str,
    riga_id: UUID,
    *,
    decisione: str,
    nota: str | None,
    expected_version: int | None,
) -> None:
    """Stessa logica di transizione di `registro_campi.applica_decisione_verifica`,
    senza il concetto di "valore vuoto" (un record esiste sempre) e senza
    dipendere da un catalogo di campi statico."""
    if decisione == "REVISION_REQUIRED" and (nota is None or nota.strip() == ""):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "La richiesta di revisione richiede una nota che spieghi cosa correggere",
        )

    campo = str(riga_id)
    stato_riga = _stato_riga(db, ctx.azienda_id, sezione_codice, campo)
    if stato_riga is None:
        stato_riga = SysRegistroStatoCampi(
            azienda_id=ctx.azienda_id,
            sezione_codice=sezione_codice,
            campo_codice=campo,
            versione=1,
        )
        db.add(stato_riga)

    if expected_version is not None and stato_riga.versione != expected_version:
        raise HTTPException(status.HTTP_409_CONFLICT, "Il record è stato modificato nel frattempo: ricaricare e riprovare")

    codice_db = STATO_API_TO_DB[decisione]
    # Un record già confermato che riceve di nuovo VERIFIED ("Salva nota")
    # aggiorna solo la nota, non la data/autore di verifica — stessa regola
    # di `applica_decisione_verifica`.
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
        sezione_codice=sezione_codice,
        campo_codice=campo,
        azione=azione,
        precedente=None,
        nuovo=nota,
    )
