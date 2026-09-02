"""Motore della tabella unificata "Albi, ruoli, licenze e certificazioni"
(Correzione 20, seconda parte della card "Attività, albi, ruoli e
licenze").

Una riga principale (`AnaTitoloAbilitativo`) con le sole informazioni
comuni, collegata 1:1 a una delle quattro strutture di dettaglio in base
alla macro-tipologia (§ punto 9: "un record Albo non può essere collegato
a un dettaglio Licenza o Certificazione") — garantito qui dall'uso di
funzioni distinte per macro-tipologia, mai un'unica funzione generica che
accetti qualunque combinazione. Le operazioni di creazione sono composite
(riga principale + dettaglio) e transazionali (§ CLAUDE.md "operazioni
composite = transazione unica"): un `db.flush()` intermedio per avere l'id
della riga principale prima di scrivere il dettaglio, un solo `db.commit()`
finale — se il dettaglio fallisse la riga principale non resterebbe orfana.

La verifica per riga (colonna "Stato") riusa `app.core.verifica_riga`
(§ punto "non deve essere creato un secondo sistema di verifica").
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext
from app.core.verifica_riga import applica_decisione_verifica_riga, leggi_stato_verifica_riga
from app.models.anagrafica import (
    AnaTitoloAbilitativo,
    AnaTitoloAbilitativoDettaglioAlbo,
    AnaTitoloAbilitativoDettaglioCertificazione,
    AnaTitoloAbilitativoDettaglioLicenza,
    AnaTitoloAbilitativoDettaglioRuolo,
    CatMacroTipologiaTitoloAbilitativo,
)
from app.schemas.titoli_abilitativi import (
    TitoloAbilitativoAlboCreate,
    TitoloAbilitativoAlboRead,
    TitoloAbilitativoCertificazioneCreate,
    TitoloAbilitativoCertificazioneRead,
    TitoloAbilitativoDetailRead,
    TitoloAbilitativoLicenzaCreate,
    TitoloAbilitativoLicenzaRead,
    TitoloAbilitativoRuoloCreate,
    TitoloAbilitativoRuoloRead,
    TitoloAbilitativoSummaryRead,
)

SEZIONE_CODICE_VERIFICA_TITOLI_ABILITATIVI = "ANAGRAFICA_AZIENDALE.TITOLI_ABILITATIVI"

# Etichetta fissa della colonna "Tipologia" per le macro-tipologie che non
# si ramificano ulteriormente (§ punto 4); "CERTIFICAZIONE_ATTESTAZIONE" non
# compare qui perché la sua etichetta dipende dal sotto_tipo del dettaglio
# (§ punto 7, vedi _ETICHETTA_SOTTO_TIPO_CERTIFICAZIONE).
_ETICHETTA_TIPOLOGIA_FISSA = {"ALBO": "Albo", "RUOLO": "Ruolo", "LICENZA": "Licenza"}
_ETICHETTA_SOTTO_TIPO_CERTIFICAZIONE = {"CERTIFICAZIONE": "Certificazione", "ATTESTAZIONE_SOA": "Attestazione SOA"}


def _macro_tipologia_per_codice(db: Session, codice: str) -> CatMacroTipologiaTitoloAbilitativo:
    riga = db.scalars(
        select(CatMacroTipologiaTitoloAbilitativo).where(CatMacroTipologiaTitoloAbilitativo.codice == codice)
    ).first()
    if riga is None:
        # Errore di configurazione (catalogo non seminato correttamente),
        # non un input utente scorretto.
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Macro-tipologia '{codice}' non censita")
    return riga


def _titolo_owned_or_404(db: Session, titolo_id: UUID, azienda_id: UUID) -> AnaTitoloAbilitativo:
    titolo = db.get(AnaTitoloAbilitativo, titolo_id)
    if titolo is None or titolo.azienda_id != azienda_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Titolo abilitativo non trovato")
    return titolo


def _verifica_macro_tipologia(db: Session, titolo: AnaTitoloAbilitativo, codice_atteso: str) -> None:
    """§ punto 9/10: un endpoint tipizzato (es. PUT .../albo/{id}) non deve
    poter leggere/scrivere un titolo di un'altra macro-tipologia — stesso
    trattamento di una risorsa non trovata, non un 409: dal punto di vista
    di quell'endpoint la riga semplicemente non esiste in quella forma."""
    macro = db.get(CatMacroTipologiaTitoloAbilitativo, titolo.macro_tipologia_id)
    if macro is None or macro.codice != codice_atteso:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Titolo abilitativo non trovato")


def _stato_verifica(db: Session, azienda_id: UUID, titolo_id: UUID) -> dict[str, Any]:
    return leggi_stato_verifica_riga(db, azienda_id, SEZIONE_CODICE_VERIFICA_TITOLI_ABILITATIVI, titolo_id)


def applica_decisione_verifica_titolo(
    db: Session,
    ctx: AziendaContext,
    titolo_id: UUID,
    *,
    decisione: str,
    nota: str | None,
    expected_version: int | None,
) -> None:
    applica_decisione_verifica_riga(
        db,
        ctx,
        SEZIONE_CODICE_VERIFICA_TITOLI_ABILITATIVI,
        titolo_id,
        decisione=decisione,
        nota=nota,
        expected_version=expected_version,
    )


# ===========================================================================
# Vista riepilogativa (tabella unificata)
# ===========================================================================


def _a_riepilogo(db: Session, titolo: AnaTitoloAbilitativo) -> TitoloAbilitativoSummaryRead:
    macro = db.get(CatMacroTipologiaTitoloAbilitativo, titolo.macro_tipologia_id)
    codice = macro.codice if macro is not None else ""
    categoria_norma: str | None = None
    etichetta_tipologia = _ETICHETTA_TIPOLOGIA_FISSA.get(codice, macro.denominazione if macro is not None else "")

    if codice == "ALBO":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioAlbo).where(AnaTitoloAbilitativoDettaglioAlbo.titolo_id == titolo.id)
        ).first()
        categoria_norma = d.categoria if d is not None else None
    elif codice == "RUOLO":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioRuolo).where(AnaTitoloAbilitativoDettaglioRuolo.titolo_id == titolo.id)
        ).first()
        categoria_norma = d.denominazione_ruolo if d is not None else None
    elif codice == "LICENZA":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioLicenza).where(
                AnaTitoloAbilitativoDettaglioLicenza.titolo_id == titolo.id
            )
        ).first()
        categoria_norma = d.tipologia_licenza if d is not None else None
    elif codice == "CERTIFICAZIONE_ATTESTAZIONE":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioCertificazione).where(
                AnaTitoloAbilitativoDettaglioCertificazione.titolo_id == titolo.id
            )
        ).first()
        if d is not None:
            categoria_norma = d.categoria_norma
            etichetta_tipologia = _ETICHETTA_SOTTO_TIPO_CERTIFICAZIONE.get(d.sotto_tipo, "Certificazione")

    stato = _stato_verifica(db, titolo.azienda_id, titolo.id)
    return TitoloAbilitativoSummaryRead(
        id=titolo.id,
        macro_tipologia_codice=codice,
        tipologia_label=etichetta_tipologia,
        categoria_norma=categoria_norma,
        numero_attestazione=titolo.numero_attestazione,
        ente_rilascio=titolo.ente_rilascio,
        data_rilascio=titolo.data_rilascio,
        data_scadenza=titolo.data_scadenza,
        senza_scadenza=titolo.senza_scadenza,
        note=titolo.note,
        created_at=titolo.created_at,
        updated_at=titolo.updated_at,
        verificationStatus=stato["status"],
        verificationVersion=stato["version"],
        revisionNote=stato["note"],
        verifiedAt=stato["verified_at"],
        verifiedBy=stato["verified_by"],
    )


def elenco_titoli(db: Session, azienda_id: UUID) -> list[TitoloAbilitativoSummaryRead]:
    titoli = db.scalars(
        select(AnaTitoloAbilitativo)
        .where(AnaTitoloAbilitativo.azienda_id == azienda_id)
        .order_by(AnaTitoloAbilitativo.created_at)
    ).all()
    return [_a_riepilogo(db, t) for t in titoli]


# ===========================================================================
# Dettaglio tipizzato (GET /{id}: § punto 8, "apre il form corretto")
# ===========================================================================


def dettaglio_titolo(db: Session, azienda_id: UUID, titolo_id: UUID) -> TitoloAbilitativoDetailRead:
    titolo = _titolo_owned_or_404(db, titolo_id, azienda_id)
    macro = db.get(CatMacroTipologiaTitoloAbilitativo, titolo.macro_tipologia_id)
    codice = macro.codice if macro is not None else ""
    stato = _stato_verifica(db, azienda_id, titolo.id)
    comuni = dict(
        id=titolo.id,
        azienda_id=titolo.azienda_id,
        numero_attestazione=titolo.numero_attestazione,
        ente_rilascio=titolo.ente_rilascio,
        data_rilascio=titolo.data_rilascio,
        data_scadenza=titolo.data_scadenza,
        senza_scadenza=titolo.senza_scadenza,
        note=titolo.note,
        created_at=titolo.created_at,
        updated_at=titolo.updated_at,
        verificationStatus=stato["status"],
        verificationVersion=stato["version"],
        revisionNote=stato["note"],
        verifiedAt=stato["verified_at"],
        verifiedBy=stato["verified_by"],
    )

    if codice == "ALBO":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioAlbo).where(AnaTitoloAbilitativoDettaglioAlbo.titolo_id == titolo.id)
        ).first()
        return TitoloAbilitativoAlboRead(**comuni, categoria=d.categoria if d is not None else None)
    if codice == "RUOLO":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioRuolo).where(AnaTitoloAbilitativoDettaglioRuolo.titolo_id == titolo.id)
        ).first()
        return TitoloAbilitativoRuoloRead(
            **comuni, denominazione_ruolo=d.denominazione_ruolo if d is not None else None
        )
    if codice == "LICENZA":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioLicenza).where(
                AnaTitoloAbilitativoDettaglioLicenza.titolo_id == titolo.id
            )
        ).first()
        return TitoloAbilitativoLicenzaRead(
            **comuni, tipologia_licenza=d.tipologia_licenza if d is not None else None
        )
    if codice == "CERTIFICAZIONE_ATTESTAZIONE":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioCertificazione).where(
                AnaTitoloAbilitativoDettaglioCertificazione.titolo_id == titolo.id
            )
        ).first()
        return TitoloAbilitativoCertificazioneRead(
            **comuni,
            sotto_tipo=d.sotto_tipo if d is not None else "CERTIFICAZIONE",
            categoria_norma=d.categoria_norma if d is not None else None,
        )
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Macro-tipologia non riconosciuta")


def elimina_titolo(db: Session, azienda_id: UUID, titolo_id: UUID) -> None:
    titolo = _titolo_owned_or_404(db, titolo_id, azienda_id)
    db.delete(titolo)  # il dettaglio segue via ON DELETE CASCADE lato database
    db.commit()


# ===========================================================================
# Form Albo
# ===========================================================================


def crea_albo(db: Session, ctx: AziendaContext, payload: TitoloAbilitativoAlboCreate) -> TitoloAbilitativoAlboRead:
    macro = _macro_tipologia_per_codice(db, "ALBO")
    titolo = AnaTitoloAbilitativo(azienda_id=ctx.azienda_id, macro_tipologia_id=macro.id, **payload.model_dump(exclude={"categoria"}))
    db.add(titolo)
    db.flush()
    db.add(AnaTitoloAbilitativoDettaglioAlbo(titolo_id=titolo.id, categoria=payload.categoria))
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


def aggiorna_albo(
    db: Session, ctx: AziendaContext, titolo_id: UUID, payload: TitoloAbilitativoAlboCreate
) -> TitoloAbilitativoAlboRead:
    titolo = _titolo_owned_or_404(db, titolo_id, ctx.azienda_id)
    _verifica_macro_tipologia(db, titolo, "ALBO")
    for campo, valore in payload.model_dump(exclude={"categoria"}).items():
        setattr(titolo, campo, valore)
    dettaglio = db.scalars(
        select(AnaTitoloAbilitativoDettaglioAlbo).where(AnaTitoloAbilitativoDettaglioAlbo.titolo_id == titolo.id)
    ).first()
    if dettaglio is None:
        dettaglio = AnaTitoloAbilitativoDettaglioAlbo(titolo_id=titolo.id)
        db.add(dettaglio)
    dettaglio.categoria = payload.categoria
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


# ===========================================================================
# Form Ruolo
# ===========================================================================


def crea_ruolo(db: Session, ctx: AziendaContext, payload: TitoloAbilitativoRuoloCreate) -> TitoloAbilitativoRuoloRead:
    macro = _macro_tipologia_per_codice(db, "RUOLO")
    titolo = AnaTitoloAbilitativo(
        azienda_id=ctx.azienda_id, macro_tipologia_id=macro.id, **payload.model_dump(exclude={"denominazione_ruolo"})
    )
    db.add(titolo)
    db.flush()
    db.add(AnaTitoloAbilitativoDettaglioRuolo(titolo_id=titolo.id, denominazione_ruolo=payload.denominazione_ruolo))
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


def aggiorna_ruolo(
    db: Session, ctx: AziendaContext, titolo_id: UUID, payload: TitoloAbilitativoRuoloCreate
) -> TitoloAbilitativoRuoloRead:
    titolo = _titolo_owned_or_404(db, titolo_id, ctx.azienda_id)
    _verifica_macro_tipologia(db, titolo, "RUOLO")
    for campo, valore in payload.model_dump(exclude={"denominazione_ruolo"}).items():
        setattr(titolo, campo, valore)
    dettaglio = db.scalars(
        select(AnaTitoloAbilitativoDettaglioRuolo).where(AnaTitoloAbilitativoDettaglioRuolo.titolo_id == titolo.id)
    ).first()
    if dettaglio is None:
        dettaglio = AnaTitoloAbilitativoDettaglioRuolo(titolo_id=titolo.id)
        db.add(dettaglio)
    dettaglio.denominazione_ruolo = payload.denominazione_ruolo
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


# ===========================================================================
# Form Licenza
# ===========================================================================


def crea_licenza(
    db: Session, ctx: AziendaContext, payload: TitoloAbilitativoLicenzaCreate
) -> TitoloAbilitativoLicenzaRead:
    macro = _macro_tipologia_per_codice(db, "LICENZA")
    titolo = AnaTitoloAbilitativo(
        azienda_id=ctx.azienda_id, macro_tipologia_id=macro.id, **payload.model_dump(exclude={"tipologia_licenza"})
    )
    db.add(titolo)
    db.flush()
    db.add(AnaTitoloAbilitativoDettaglioLicenza(titolo_id=titolo.id, tipologia_licenza=payload.tipologia_licenza))
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


def aggiorna_licenza(
    db: Session, ctx: AziendaContext, titolo_id: UUID, payload: TitoloAbilitativoLicenzaCreate
) -> TitoloAbilitativoLicenzaRead:
    titolo = _titolo_owned_or_404(db, titolo_id, ctx.azienda_id)
    _verifica_macro_tipologia(db, titolo, "LICENZA")
    for campo, valore in payload.model_dump(exclude={"tipologia_licenza"}).items():
        setattr(titolo, campo, valore)
    dettaglio = db.scalars(
        select(AnaTitoloAbilitativoDettaglioLicenza).where(AnaTitoloAbilitativoDettaglioLicenza.titolo_id == titolo.id)
    ).first()
    if dettaglio is None:
        dettaglio = AnaTitoloAbilitativoDettaglioLicenza(titolo_id=titolo.id)
        db.add(dettaglio)
    dettaglio.tipologia_licenza = payload.tipologia_licenza
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


# ===========================================================================
# Form Certificazione o attestazione
# ===========================================================================


def crea_certificazione(
    db: Session, ctx: AziendaContext, payload: TitoloAbilitativoCertificazioneCreate
) -> TitoloAbilitativoCertificazioneRead:
    macro = _macro_tipologia_per_codice(db, "CERTIFICAZIONE_ATTESTAZIONE")
    titolo = AnaTitoloAbilitativo(
        azienda_id=ctx.azienda_id,
        macro_tipologia_id=macro.id,
        **payload.model_dump(exclude={"sotto_tipo", "categoria_norma"}),
    )
    db.add(titolo)
    db.flush()
    db.add(
        AnaTitoloAbilitativoDettaglioCertificazione(
            titolo_id=titolo.id, sotto_tipo=payload.sotto_tipo, categoria_norma=payload.categoria_norma
        )
    )
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


def aggiorna_certificazione(
    db: Session, ctx: AziendaContext, titolo_id: UUID, payload: TitoloAbilitativoCertificazioneCreate
) -> TitoloAbilitativoCertificazioneRead:
    titolo = _titolo_owned_or_404(db, titolo_id, ctx.azienda_id)
    _verifica_macro_tipologia(db, titolo, "CERTIFICAZIONE_ATTESTAZIONE")
    for campo, valore in payload.model_dump(exclude={"sotto_tipo", "categoria_norma"}).items():
        setattr(titolo, campo, valore)
    dettaglio = db.scalars(
        select(AnaTitoloAbilitativoDettaglioCertificazione).where(
            AnaTitoloAbilitativoDettaglioCertificazione.titolo_id == titolo.id
        )
    ).first()
    if dettaglio is None:
        dettaglio = AnaTitoloAbilitativoDettaglioCertificazione(titolo_id=titolo.id, sotto_tipo=payload.sotto_tipo)
        db.add(dettaglio)
    dettaglio.sotto_tipo = payload.sotto_tipo
    dettaglio.categoria_norma = payload.categoria_norma
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]
