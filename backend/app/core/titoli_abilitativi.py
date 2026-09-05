"""Motore della tabella unificata "Albi, ruoli, licenze e certificazioni"
(Correzione 20 + Correzione 21, card "Attività, albi, ruoli e licenze").

Una riga principale (`AnaTitoloAbilitativo`) con le sole informazioni
comuni, collegata 1:1 a una delle quattro strutture di dettaglio in base
alla macro-tipologia (§ punto 9: "un record Albo non può essere collegato
a un dettaglio Licenza o Certificazione") — garantito qui dall'uso di
funzioni distinte per macro-tipologia, mai un'unica funzione generica che
accetti qualunque combinazione. Le operazioni di creazione sono composite
(riga principale + dettaglio, + relazioni settori IAF/categorie SOA per la
certificazione) e transazionali (§ CLAUDE.md "operazioni composite =
transazione unica"): un `db.flush()` intermedio per avere l'id della riga
principale prima di scrivere il dettaglio, un solo `db.commit()` finale.

La verifica per riga (colonna "Verifica") riusa `app.core.verifica_riga`
(§ punto "non deve essere creato un secondo sistema di verifica"); "Stato
del titolo" (§ Correzione 21 punto 1) è un campo dati distinto, non un
secondo stato di verifica.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext
from app.core.verifica_riga import applica_decisione_verifica_riga, elimina_stato_verifica_riga, leggi_stato_verifica_riga
from app.models.anagrafica import (
    AnaSede,
    AnaTitoloAbilitativo,
    AnaTitoloAbilitativoDettaglioAlbo,
    AnaTitoloAbilitativoDettaglioCertificazione,
    AnaTitoloAbilitativoDettaglioLicenza,
    AnaTitoloAbilitativoDettaglioRuolo,
    CatCategoriaSoa,
    CatClassificaSoa,
    CatMacroTipologiaTitoloAbilitativo,
    CatNormaCertificazione,
    CatStatoTitoloAbilitativo,
    CatTipologiaAlbo,
    CatTipologiaCertificazioneAttestazione,
    CatTipologiaLicenza,
    CatTipologiaRuolo,
    RelTitoloAbilitativoSettoreIAF,
    RelTitoloAbilitativoSoaCategoria,
)
from app.models.personale import AnaPersone
from app.models.sistema import CatSettoreIAF
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
# compare qui perché la sua etichetta è la denominazione del sotto-tipo a
# catalogo (§ Correzione 21 punto 5).
_ETICHETTA_TIPOLOGIA_FISSA = {"ALBO": "Albo", "RUOLO": "Ruolo", "LICENZA": "Licenza"}


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


def _stato_titolo_label(db: Session, stato_titolo_id: UUID | None) -> str | None:
    if stato_titolo_id is None:
        return None
    stato = db.get(CatStatoTitoloAbilitativo, stato_titolo_id)
    return stato.denominazione if stato is not None else None


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


def _riga_base_kwargs(db: Session, titolo: AnaTitoloAbilitativo) -> dict[str, Any]:
    stato = _stato_verifica(db, titolo.azienda_id, titolo.id)
    return dict(
        id=titolo.id,
        numero_attestazione=titolo.numero_attestazione,
        ente_rilascio=titolo.ente_rilascio,
        data_rilascio=titolo.data_rilascio,
        data_scadenza=titolo.data_scadenza,
        senza_scadenza=titolo.senza_scadenza,
        note=titolo.note,
        stato_titolo_label=_stato_titolo_label(db, titolo.stato_titolo_id),
        created_at=titolo.created_at,
        updated_at=titolo.updated_at,
        verificationStatus=stato["status"],
        verificationVersion=stato["version"],
        revisionNote=stato["note"],
        verifiedAt=stato["verified_at"],
        verifiedBy=stato["verified_by"],
    )


def _righe_riepilogo(db: Session, titolo: AnaTitoloAbilitativo) -> list[TitoloAbilitativoSummaryRead]:
    """§ punto 7, ultimo comma: per l'Attestazione SOA la vista unificata può
    restituire più righe grafiche (una per coppia categoria/classifica) che
    condividono lo stesso `id` — tutte aprono lo stesso form. Ogni altra
    macro-tipologia produce sempre una sola riga."""
    macro = db.get(CatMacroTipologiaTitoloAbilitativo, titolo.macro_tipologia_id)
    codice = macro.codice if macro is not None else ""
    base = _riga_base_kwargs(db, titolo)

    if codice == "ALBO":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioAlbo).where(AnaTitoloAbilitativoDettaglioAlbo.titolo_id == titolo.id)
        ).first()
        parti = [p for p in [d.denominazione_albo if d else None, d.sezione if d else None, d.categoria if d else None] if p]
        categoria_norma = " — ".join(parti) if parti else None
        return [
            TitoloAbilitativoSummaryRead(
                **base, riga_key=str(titolo.id), macro_tipologia_codice=codice,
                tipologia_label=_ETICHETTA_TIPOLOGIA_FISSA["ALBO"], categoria_norma=categoria_norma,
            )
        ]

    if codice == "RUOLO":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioRuolo).where(AnaTitoloAbilitativoDettaglioRuolo.titolo_id == titolo.id)
        ).first()
        parti = [p for p in [d.denominazione_ruolo if d else None, d.sezione_categoria if d else None] if p]
        categoria_norma = " — ".join(parti) if parti else None
        return [
            TitoloAbilitativoSummaryRead(
                **base, riga_key=str(titolo.id), macro_tipologia_codice=codice,
                tipologia_label=_ETICHETTA_TIPOLOGIA_FISSA["RUOLO"], categoria_norma=categoria_norma,
            )
        ]

    if codice == "LICENZA":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioLicenza).where(
                AnaTitoloAbilitativoDettaglioLicenza.titolo_id == titolo.id
            )
        ).first()
        tipologia = db.get(CatTipologiaLicenza, d.tipologia_licenza_id) if d and d.tipologia_licenza_id else None
        parti = [p for p in [tipologia.denominazione if tipologia else None, d.denominazione_licenza if d else None] if p]
        categoria_norma = " — ".join(parti) if parti else None
        return [
            TitoloAbilitativoSummaryRead(
                **base, riga_key=str(titolo.id), macro_tipologia_codice=codice,
                tipologia_label=_ETICHETTA_TIPOLOGIA_FISSA["LICENZA"], categoria_norma=categoria_norma,
            )
        ]

    if codice == "CERTIFICAZIONE_ATTESTAZIONE":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioCertificazione).where(
                AnaTitoloAbilitativoDettaglioCertificazione.titolo_id == titolo.id
            )
        ).first()
        if d is None:
            return [
                TitoloAbilitativoSummaryRead(
                    **base, riga_key=str(titolo.id), macro_tipologia_codice=codice, tipologia_label="", categoria_norma=None
                )
            ]
        sotto_tipo = db.get(CatTipologiaCertificazioneAttestazione, d.sotto_tipo_id) if d.sotto_tipo_id else None
        tipologia_label = sotto_tipo.denominazione if sotto_tipo is not None else ""
        sotto_codice = sotto_tipo.codice if sotto_tipo is not None else None

        if sotto_codice == "ATTESTAZIONE_SOA":
            righe_soa = db.scalars(
                select(RelTitoloAbilitativoSoaCategoria).where(
                    RelTitoloAbilitativoSoaCategoria.dettaglio_certificazione_id == d.id
                )
            ).all()
            if not righe_soa:
                return [
                    TitoloAbilitativoSummaryRead(
                        **base, riga_key=str(titolo.id), macro_tipologia_codice=codice,
                        tipologia_label=tipologia_label, categoria_norma=None,
                    )
                ]
            righe: list[TitoloAbilitativoSummaryRead] = []
            for rel in righe_soa:
                categoria = db.get(CatCategoriaSoa, rel.categoria_soa_id)
                classifica = db.get(CatClassificaSoa, rel.classifica_soa_id) if rel.classifica_soa_id else None
                parti = [p for p in [categoria.denominazione if categoria else None] if p]
                if classifica is not None:
                    parti.append(f"Classifica {classifica.denominazione}")
                righe.append(
                    TitoloAbilitativoSummaryRead(
                        **base, riga_key=f"{titolo.id}:{rel.id}", macro_tipologia_codice=codice,
                        tipologia_label=tipologia_label, categoria_norma=" — ".join(parti) if parti else None,
                    )
                )
            return righe

        if sotto_codice == "ALTRA":
            parti = [p for p in [d.denominazione, d.schema_norma] if p]
            categoria_norma = " — ".join(parti) if parti else None
        else:
            norma = db.get(CatNormaCertificazione, d.norma_id) if d.norma_id else None
            parti = [p for p in [norma.denominazione if norma else None, d.edizione_anno] if p]
            categoria_norma = " — ".join(parti) if parti else None

        return [
            TitoloAbilitativoSummaryRead(
                **base, riga_key=str(titolo.id), macro_tipologia_codice=codice,
                tipologia_label=tipologia_label, categoria_norma=categoria_norma,
            )
        ]

    return [
        TitoloAbilitativoSummaryRead(
            **base, riga_key=str(titolo.id), macro_tipologia_codice=codice, tipologia_label="", categoria_norma=None
        )
    ]


def elenco_titoli(db: Session, azienda_id: UUID) -> list[TitoloAbilitativoSummaryRead]:
    titoli = db.scalars(
        select(AnaTitoloAbilitativo)
        .where(AnaTitoloAbilitativo.azienda_id == azienda_id)
        .order_by(AnaTitoloAbilitativo.created_at)
    ).all()
    righe: list[TitoloAbilitativoSummaryRead] = []
    for t in titoli:
        righe.extend(_righe_riepilogo(db, t))
    return righe


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
        stato_titolo_id=titolo.stato_titolo_id,
        stato_titolo=db.get(CatStatoTitoloAbilitativo, titolo.stato_titolo_id) if titolo.stato_titolo_id else None,
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
        return TitoloAbilitativoAlboRead(
            **comuni,
            tipologia_albo_id=d.tipologia_albo_id if d else None,
            tipologia_albo=db.get(CatTipologiaAlbo, d.tipologia_albo_id) if d and d.tipologia_albo_id else None,
            categoria=d.categoria if d else None,
            denominazione_albo=d.denominazione_albo if d else None,
            sezione=d.sezione if d else None,
            persona_id=d.persona_id if d else None,
            persona=db.get(AnaPersone, d.persona_id) if d and d.persona_id else None,
            provincia_ambito=d.provincia_ambito if d else None,
            attivita_abilitazioni=d.attivita_abilitazioni if d else None,
        )

    if codice == "RUOLO":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioRuolo).where(AnaTitoloAbilitativoDettaglioRuolo.titolo_id == titolo.id)
        ).first()
        return TitoloAbilitativoRuoloRead(
            **comuni,
            tipologia_ruolo_id=d.tipologia_ruolo_id if d else None,
            tipologia_ruolo=db.get(CatTipologiaRuolo, d.tipologia_ruolo_id) if d and d.tipologia_ruolo_id else None,
            denominazione_ruolo=d.denominazione_ruolo if d else None,
            sezione_categoria=d.sezione_categoria if d else None,
            persona_id=d.persona_id if d else None,
            persona=db.get(AnaPersone, d.persona_id) if d and d.persona_id else None,
            provincia_ambito=d.provincia_ambito if d else None,
            attivita_abilitate=d.attivita_abilitate if d else None,
        )

    if codice == "LICENZA":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioLicenza).where(
                AnaTitoloAbilitativoDettaglioLicenza.titolo_id == titolo.id
            )
        ).first()
        return TitoloAbilitativoLicenzaRead(
            **comuni,
            tipologia_licenza_id=d.tipologia_licenza_id if d else None,
            tipologia_licenza=db.get(CatTipologiaLicenza, d.tipologia_licenza_id) if d and d.tipologia_licenza_id else None,
            denominazione_licenza=d.denominazione_licenza if d else None,
            oggetto_attivita=d.oggetto_attivita if d else None,
            persona_id=d.persona_id if d else None,
            persona=db.get(AnaPersone, d.persona_id) if d and d.persona_id else None,
            sede_id=d.sede_id if d else None,
            sede=db.get(AnaSede, d.sede_id) if d and d.sede_id else None,
            ambito_territoriale=d.ambito_territoriale if d else None,
            data_efficacia=d.data_efficacia if d else None,
            condizioni_prescrizioni=d.condizioni_prescrizioni if d else None,
            estremi_rinnovo=d.estremi_rinnovo if d else None,
        )

    if codice == "CERTIFICAZIONE_ATTESTAZIONE":
        d = db.scalars(
            select(AnaTitoloAbilitativoDettaglioCertificazione).where(
                AnaTitoloAbilitativoDettaglioCertificazione.titolo_id == titolo.id
            )
        ).first()
        settori_iaf: list[CatSettoreIAF] = []
        categorie_soa_out: list[Any] = []
        if d is not None:
            settore_ids = db.scalars(
                select(RelTitoloAbilitativoSettoreIAF.settore_iaf_id).where(
                    RelTitoloAbilitativoSettoreIAF.dettaglio_certificazione_id == d.id
                )
            ).all()
            if settore_ids:
                settori_iaf = db.scalars(select(CatSettoreIAF).where(CatSettoreIAF.id.in_(settore_ids))).all()

            righe_soa = db.scalars(
                select(RelTitoloAbilitativoSoaCategoria).where(
                    RelTitoloAbilitativoSoaCategoria.dettaglio_certificazione_id == d.id
                )
            ).all()
            for rel in righe_soa:
                categorie_soa_out.append(
                    dict(
                        id=rel.id,
                        categoria_soa_id=rel.categoria_soa_id,
                        classifica_soa_id=rel.classifica_soa_id,
                        categoria_soa=db.get(CatCategoriaSoa, rel.categoria_soa_id),
                        classifica_soa=db.get(CatClassificaSoa, rel.classifica_soa_id) if rel.classifica_soa_id else None,
                    )
                )

        return TitoloAbilitativoCertificazioneRead(
            **comuni,
            sotto_tipo_id=d.sotto_tipo_id if d else None,
            sotto_tipo=db.get(CatTipologiaCertificazioneAttestazione, d.sotto_tipo_id) if d and d.sotto_tipo_id else None,
            categoria_norma=d.categoria_norma if d else None,
            norma_id=d.norma_id if d else None,
            norma=db.get(CatNormaCertificazione, d.norma_id) if d and d.norma_id else None,
            edizione_anno=d.edizione_anno if d else None,
            organismo_accreditamento=d.organismo_accreditamento if d else None,
            campo_applicazione=d.campo_applicazione if d else None,
            data_prima_emissione=d.data_prima_emissione if d else None,
            settori_iaf=settori_iaf,
            categorie_soa=categorie_soa_out,
            denominazione=d.denominazione if d else None,
            schema_norma=d.schema_norma if d else None,
        )

    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Macro-tipologia non riconosciuta")


def elimina_titolo(db: Session, azienda_id: UUID, titolo_id: UUID) -> None:
    titolo = _titolo_owned_or_404(db, titolo_id, azienda_id)
    db.delete(titolo)  # il dettaglio segue via ON DELETE CASCADE lato database
    elimina_stato_verifica_riga(db, azienda_id, SEZIONE_CODICE_VERIFICA_TITOLI_ABILITATIVI, titolo_id)
    db.commit()


# ===========================================================================
# Form Albo (§ Correzione 21 punto 2)
# ===========================================================================

_CAMPI_DETTAGLIO_ALBO = {
    "tipologia_albo_id", "categoria", "denominazione_albo", "sezione", "persona_id",
    "provincia_ambito", "attivita_abilitazioni",
}


def crea_albo(db: Session, ctx: AziendaContext, payload: TitoloAbilitativoAlboCreate) -> TitoloAbilitativoAlboRead:
    macro = _macro_tipologia_per_codice(db, "ALBO")
    dump = payload.model_dump()
    titolo = AnaTitoloAbilitativo(
        azienda_id=ctx.azienda_id, macro_tipologia_id=macro.id,
        **{k: v for k, v in dump.items() if k not in _CAMPI_DETTAGLIO_ALBO},
    )
    db.add(titolo)
    db.flush()
    db.add(
        AnaTitoloAbilitativoDettaglioAlbo(
            titolo_id=titolo.id, **{k: v for k, v in dump.items() if k in _CAMPI_DETTAGLIO_ALBO}
        )
    )
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


def aggiorna_albo(
    db: Session, ctx: AziendaContext, titolo_id: UUID, payload: TitoloAbilitativoAlboCreate
) -> TitoloAbilitativoAlboRead:
    titolo = _titolo_owned_or_404(db, titolo_id, ctx.azienda_id)
    _verifica_macro_tipologia(db, titolo, "ALBO")
    dump = payload.model_dump()
    for campo, valore in dump.items():
        if campo not in _CAMPI_DETTAGLIO_ALBO:
            setattr(titolo, campo, valore)
    dettaglio = db.scalars(
        select(AnaTitoloAbilitativoDettaglioAlbo).where(AnaTitoloAbilitativoDettaglioAlbo.titolo_id == titolo.id)
    ).first()
    if dettaglio is None:
        dettaglio = AnaTitoloAbilitativoDettaglioAlbo(titolo_id=titolo.id)
        db.add(dettaglio)
    for campo, valore in dump.items():
        if campo in _CAMPI_DETTAGLIO_ALBO:
            setattr(dettaglio, campo, valore)
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


# ===========================================================================
# Form Ruolo (§ Correzione 21 punto 3)
# ===========================================================================

_CAMPI_DETTAGLIO_RUOLO = {
    "tipologia_ruolo_id", "denominazione_ruolo", "sezione_categoria", "persona_id",
    "provincia_ambito", "attivita_abilitate",
}


def crea_ruolo(db: Session, ctx: AziendaContext, payload: TitoloAbilitativoRuoloCreate) -> TitoloAbilitativoRuoloRead:
    macro = _macro_tipologia_per_codice(db, "RUOLO")
    dump = payload.model_dump()
    titolo = AnaTitoloAbilitativo(
        azienda_id=ctx.azienda_id, macro_tipologia_id=macro.id,
        **{k: v for k, v in dump.items() if k not in _CAMPI_DETTAGLIO_RUOLO},
    )
    db.add(titolo)
    db.flush()
    db.add(
        AnaTitoloAbilitativoDettaglioRuolo(
            titolo_id=titolo.id, **{k: v for k, v in dump.items() if k in _CAMPI_DETTAGLIO_RUOLO}
        )
    )
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


def aggiorna_ruolo(
    db: Session, ctx: AziendaContext, titolo_id: UUID, payload: TitoloAbilitativoRuoloCreate
) -> TitoloAbilitativoRuoloRead:
    titolo = _titolo_owned_or_404(db, titolo_id, ctx.azienda_id)
    _verifica_macro_tipologia(db, titolo, "RUOLO")
    dump = payload.model_dump()
    for campo, valore in dump.items():
        if campo not in _CAMPI_DETTAGLIO_RUOLO:
            setattr(titolo, campo, valore)
    dettaglio = db.scalars(
        select(AnaTitoloAbilitativoDettaglioRuolo).where(AnaTitoloAbilitativoDettaglioRuolo.titolo_id == titolo.id)
    ).first()
    if dettaglio is None:
        dettaglio = AnaTitoloAbilitativoDettaglioRuolo(titolo_id=titolo.id)
        db.add(dettaglio)
    for campo, valore in dump.items():
        if campo in _CAMPI_DETTAGLIO_RUOLO:
            setattr(dettaglio, campo, valore)
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


# ===========================================================================
# Form Licenza (§ Correzione 21 punto 4)
# ===========================================================================

_CAMPI_DETTAGLIO_LICENZA = {
    "tipologia_licenza_id", "denominazione_licenza", "oggetto_attivita", "persona_id", "sede_id",
    "ambito_territoriale", "data_efficacia", "condizioni_prescrizioni", "estremi_rinnovo",
}


def crea_licenza(
    db: Session, ctx: AziendaContext, payload: TitoloAbilitativoLicenzaCreate
) -> TitoloAbilitativoLicenzaRead:
    macro = _macro_tipologia_per_codice(db, "LICENZA")
    dump = payload.model_dump()
    titolo = AnaTitoloAbilitativo(
        azienda_id=ctx.azienda_id, macro_tipologia_id=macro.id,
        **{k: v for k, v in dump.items() if k not in _CAMPI_DETTAGLIO_LICENZA},
    )
    db.add(titolo)
    db.flush()
    db.add(
        AnaTitoloAbilitativoDettaglioLicenza(
            titolo_id=titolo.id, **{k: v for k, v in dump.items() if k in _CAMPI_DETTAGLIO_LICENZA}
        )
    )
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


def aggiorna_licenza(
    db: Session, ctx: AziendaContext, titolo_id: UUID, payload: TitoloAbilitativoLicenzaCreate
) -> TitoloAbilitativoLicenzaRead:
    titolo = _titolo_owned_or_404(db, titolo_id, ctx.azienda_id)
    _verifica_macro_tipologia(db, titolo, "LICENZA")
    dump = payload.model_dump()
    for campo, valore in dump.items():
        if campo not in _CAMPI_DETTAGLIO_LICENZA:
            setattr(titolo, campo, valore)
    dettaglio = db.scalars(
        select(AnaTitoloAbilitativoDettaglioLicenza).where(AnaTitoloAbilitativoDettaglioLicenza.titolo_id == titolo.id)
    ).first()
    if dettaglio is None:
        dettaglio = AnaTitoloAbilitativoDettaglioLicenza(titolo_id=titolo.id)
        db.add(dettaglio)
    for campo, valore in dump.items():
        if campo in _CAMPI_DETTAGLIO_LICENZA:
            setattr(dettaglio, campo, valore)
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


# ===========================================================================
# Form Certificazione o attestazione (§ Correzione 21 punto 5)
# ===========================================================================

_CAMPI_DETTAGLIO_CERTIFICAZIONE = {
    "sotto_tipo_id", "norma_id", "edizione_anno", "organismo_accreditamento", "campo_applicazione",
    "data_prima_emissione", "denominazione", "schema_norma",
}
_CAMPI_RELAZIONE_CERTIFICAZIONE = {"settori_iaf_ids", "categorie_soa"}


def _calcola_categoria_norma_certificazione(
    db: Session, dettaglio: AnaTitoloAbilitativoDettaglioCertificazione, sotto_tipo_codice: str | None
) -> str | None:
    """Testo mostrato in "Categoria / norma" (§ punto 4), ricalcolato dal
    backend ad ogni scrittura — mai il dato sorgente. Per l'Attestazione SOA
    resta sempre None: la colonna è risolta a lettura, una riga per
    categoria/classifica (§ punto 7, vedi `_righe_riepilogo`)."""
    if sotto_tipo_codice == "ATTESTAZIONE_SOA":
        return None
    if sotto_tipo_codice == "ALTRA":
        parti = [p for p in [dettaglio.denominazione, dettaglio.schema_norma] if p]
        return " — ".join(parti) if parti else None
    norma = db.get(CatNormaCertificazione, dettaglio.norma_id) if dettaglio.norma_id else None
    parti = [p for p in [norma.denominazione if norma else None, dettaglio.edizione_anno] if p]
    return " — ".join(parti) if parti else None


def _sincronizza_settori_iaf(db: Session, dettaglio_id: UUID, settori_iaf_ids: list[UUID]) -> None:
    db.query(RelTitoloAbilitativoSettoreIAF).filter(
        RelTitoloAbilitativoSettoreIAF.dettaglio_certificazione_id == dettaglio_id
    ).delete()
    for settore_id in settori_iaf_ids:
        db.add(RelTitoloAbilitativoSettoreIAF(dettaglio_certificazione_id=dettaglio_id, settore_iaf_id=settore_id))


def _sincronizza_categorie_soa(db: Session, dettaglio_id: UUID, categorie: list[Any]) -> None:
    db.query(RelTitoloAbilitativoSoaCategoria).filter(
        RelTitoloAbilitativoSoaCategoria.dettaglio_certificazione_id == dettaglio_id
    ).delete()
    for riga in categorie:
        db.add(
            RelTitoloAbilitativoSoaCategoria(
                dettaglio_certificazione_id=dettaglio_id,
                categoria_soa_id=riga.categoria_soa_id,
                classifica_soa_id=riga.classifica_soa_id,
            )
        )


def crea_certificazione(
    db: Session, ctx: AziendaContext, payload: TitoloAbilitativoCertificazioneCreate
) -> TitoloAbilitativoCertificazioneRead:
    macro = _macro_tipologia_per_codice(db, "CERTIFICAZIONE_ATTESTAZIONE")
    dump = payload.model_dump(exclude=_CAMPI_RELAZIONE_CERTIFICAZIONE)
    titolo = AnaTitoloAbilitativo(
        azienda_id=ctx.azienda_id, macro_tipologia_id=macro.id,
        **{k: v for k, v in dump.items() if k not in _CAMPI_DETTAGLIO_CERTIFICAZIONE},
    )
    db.add(titolo)
    db.flush()

    sotto_tipo = db.get(CatTipologiaCertificazioneAttestazione, payload.sotto_tipo_id)
    if sotto_tipo is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Tipologia di certificazione o attestazione non valida")

    dettaglio = AnaTitoloAbilitativoDettaglioCertificazione(
        titolo_id=titolo.id, **{k: v for k, v in dump.items() if k in _CAMPI_DETTAGLIO_CERTIFICAZIONE}
    )
    dettaglio.categoria_norma = _calcola_categoria_norma_certificazione(db, dettaglio, sotto_tipo.codice)
    db.add(dettaglio)
    db.flush()

    _sincronizza_settori_iaf(db, dettaglio.id, payload.settori_iaf_ids)
    _sincronizza_categorie_soa(db, dettaglio.id, payload.categorie_soa)

    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]


def aggiorna_certificazione(
    db: Session, ctx: AziendaContext, titolo_id: UUID, payload: TitoloAbilitativoCertificazioneCreate
) -> TitoloAbilitativoCertificazioneRead:
    titolo = _titolo_owned_or_404(db, titolo_id, ctx.azienda_id)
    _verifica_macro_tipologia(db, titolo, "CERTIFICAZIONE_ATTESTAZIONE")
    dump = payload.model_dump(exclude=_CAMPI_RELAZIONE_CERTIFICAZIONE)
    for campo, valore in dump.items():
        if campo not in _CAMPI_DETTAGLIO_CERTIFICAZIONE:
            setattr(titolo, campo, valore)

    sotto_tipo = db.get(CatTipologiaCertificazioneAttestazione, payload.sotto_tipo_id)
    if sotto_tipo is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Tipologia di certificazione o attestazione non valida")

    dettaglio = db.scalars(
        select(AnaTitoloAbilitativoDettaglioCertificazione).where(
            AnaTitoloAbilitativoDettaglioCertificazione.titolo_id == titolo.id
        )
    ).first()
    if dettaglio is None:
        dettaglio = AnaTitoloAbilitativoDettaglioCertificazione(titolo_id=titolo.id)
        db.add(dettaglio)
    for campo, valore in dump.items():
        if campo in _CAMPI_DETTAGLIO_CERTIFICAZIONE:
            setattr(dettaglio, campo, valore)
    dettaglio.categoria_norma = _calcola_categoria_norma_certificazione(db, dettaglio, sotto_tipo.codice)
    db.flush()

    _sincronizza_settori_iaf(db, dettaglio.id, payload.settori_iaf_ids)
    _sincronizza_categorie_soa(db, dettaglio.id, payload.categorie_soa)

    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo.id)  # type: ignore[return-value]
