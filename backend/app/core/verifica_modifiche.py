"""Motore del flusso di verifica e presa visione delle modifiche
(`sys_presa_visione_modifiche`, doc/Specifica_tecnica_presa_visione_modifiche.pdf
e correzioni della Revisione 2, vedi migrazione 0010).

Riservato al profilo CONSULENTE (decisione utente 2026-08-14): un admin
aziendale o un operatore non vede né conferma alcuna verifica. Nessuna
entità applicativa è agganciata a questo meccanismo in questo intervento —
`apri_o_riapri_verifica` è il punto di integrazione che un modulo futuro
richiamerà quando un proprio record cambia (stesso principio di
"niente logica duplicata": la funzione va riusata, non reimplementata).

Modello di storicizzazione: nessuno storico delle verifiche passate ("reset
atomico"). Una nuova modifica allo stesso record (stessa `utente_id`,
`entita`, `record_id`) aggiorna la riga esistente invece di crearne una
nuova: la riporta a DA_VERIFICARE e azzera modifica_vista_at,
presa_visione_at e nota_verifica.
"""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.models.sistema import SysPresaVisioneModifiche

STATO_DA_VERIFICARE = "DA_VERIFICARE"
STATO_APPROVATO = "APPROVATO"
STATO_IN_REVISIONE = "IN_REVISIONE"


def require_consulente_azienda(
    ctx: AziendaContext = Depends(get_current_azienda),
) -> AziendaContext:
    """Come `get_current_azienda`, ma richiede in aggiunta che il profilo
    attivo sull'azienda corrente sia CONSULENTE: la verifica delle modifiche
    non è mai visibile né agibile da un admin aziendale o un operatore."""

    if ctx.profilo != "CONSULENTE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La verifica delle modifiche è riservata al consulente.",
        )
    return ctx


def get_owned_or_404(db: Session, ctx: AziendaContext, verifica_id: UUID) -> SysPresaVisioneModifiche:
    riga = db.get(SysPresaVisioneModifiche, verifica_id)
    if riga is None or riga.azienda_id != ctx.azienda_id or riga.utente_id != ctx.utente_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verifica non trovata")
    return riga


def apri_o_riapri_verifica(
    db: Session, *, azienda_id: UUID, utente_id: UUID, entita: str, record_id: UUID
) -> SysPresaVisioneModifiche:
    """Punto di integrazione per i moduli che vogliono sottoporre un proprio
    record a verifica: da richiamare nella stessa transazione della scrittura
    che modifica il record (operazione composita, non due passi separati).

    Se non esiste ancora una riga per questo utente/entità/record, la crea.
    Se esiste già, applica il reset atomico: la riporta a DA_VERIFICARE e
    azzera i timestamp/nota della verifica precedente, aggiornando solo il
    momento di rilevazione."""

    riga = db.scalars(
        select(SysPresaVisioneModifiche).where(
            SysPresaVisioneModifiche.utente_id == utente_id,
            SysPresaVisioneModifiche.entita == entita,
            SysPresaVisioneModifiche.record_id == record_id,
        )
    ).first()

    if riga is None:
        riga = SysPresaVisioneModifiche(
            azienda_id=azienda_id,
            utente_id=utente_id,
            entita=entita,
            record_id=record_id,
        )
        db.add(riga)
    else:
        # server_default si applica solo in INSERT: alla riapertura i due
        # timestamp vanno aggiornati esplicitamente con la stessa espressione
        # SQL (func.now()), non con un valore letto lato Python, per restare
        # coerenti con l'orario del database.
        riga.stato_verifica_codice = STATO_DA_VERIFICARE
        riga.modifica_vista_at = None
        riga.presa_visione_at = None
        riga.nota_verifica = None
        riga.modifica_rilevata_at = func.now()
        riga.stato_verifica_at = func.now()

    db.flush()
    db.refresh(riga)
    return riga
