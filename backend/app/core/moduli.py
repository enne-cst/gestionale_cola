"""Motore di configurazione dei moduli (documento di progetto, cap. 3.1.8).

Un'azienda vede sempre i moduli marcati come `base` in `cat_moduli` (es.
Anagrafica Aziendale, Scadenziario Generale). Gli altri moduli si sbloccano
in base alla combinazione tra i settori IAF a cui l'azienda appartiene
(`rel_aziende_settori_iaf`) e le certificazioni attive, tramite la tabella di
configurazione `cfg_moduli`.

Questa è l'unica funzione che decide quali moduli sono visibili per
un'azienda: non va duplicata la logica altrove (principio di
centralizzazione della logica di business, doc. cap. 2.3.2). Il gating più
fine, a livello di singola sezione interna a un modulo, è in
`app.core.sezioni` — entrambi i motori condividono la stessa nozione di
"certificazione attiva" (`certificazioni_attive_ids`).
"""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.sezioni import certificazioni_attive_ids
from app.database import get_db
from app.models.sistema import CatModulo, CfgModulo, RelAziendaSettoreIAF


def get_moduli_abilitati(db: Session, azienda_id: UUID) -> set[str]:
    """Ritorna i nomi dei moduli visibili per l'azienda: moduli base sempre
    inclusi, più i moduli sbloccati dai pacchetti (certificazioni attive)
    per i settori IAF dell'azienda."""

    moduli_base = set(
        db.scalars(select(CatModulo.nome).where(CatModulo.base.is_(True), CatModulo.attiva.is_(True)))
    )

    settori_ids = list(
        db.scalars(select(RelAziendaSettoreIAF.settore_iaf_id).where(RelAziendaSettoreIAF.azienda_id == azienda_id))
    )

    certificazioni_ids = list(certificazioni_attive_ids(db, azienda_id))

    moduli_sbloccati: set[str] = set()
    if settori_ids and certificazioni_ids:
        moduli_sbloccati = set(
            db.scalars(
                select(CatModulo.nome)
                .join(CfgModulo, CfgModulo.modulo_id == CatModulo.id)
                .where(
                    CfgModulo.settore_iaf_id.in_(settori_ids),
                    CfgModulo.certificazione_id.in_(certificazioni_ids),
                    CatModulo.attiva.is_(True),
                )
            )
        )

    return moduli_base | moduli_sbloccati


def require_modulo(nome_modulo: str):
    """Dependency FastAPI: 403 se il modulo non è abilitato per l'azienda
    corrente. Va applicata a ogni router di un modulo non-base, così
    l'abbonamento (pacchetti attivi) determina davvero cosa è raggiungibile,
    non solo cosa è visibile in interfaccia."""

    def _dependency(
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
    ) -> None:
        if nome_modulo not in get_moduli_abilitati(db, ctx.azienda_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Il modulo '{nome_modulo}' non è abilitato per questa azienda.",
            )

    return _dependency
