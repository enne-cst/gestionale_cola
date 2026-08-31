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
from app.models.anagrafica import AnaAmministrazioneControllo, AnaOrganiControllo, CatAssettoControllo, CatOrganoAmministrativo
from app.models.personale import CatCaratteristicaIncarico, CatRuolo, PerIncarico, PerIncaricoValore, RelRuoloCaratteristica
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
# "Attivo"/"in carica" = senza data di cessazione (A02), non lo stato
# testuale A25 (catalogo libero senza `valori_ammessi` imposti a livello di
# dominio, quindi non abbastanza affidabile da usare come unica fonte per
# bloccare un salvataggio). Helper condiviso da
# `verifica_amministratore_unico_disponibile` (Correzione 05) e da
# `verifica_transizione_nessun_organo_controllo` (Correzione 12): stessa
# nozione di "incarico attivo per un insieme di ruoli", non duplicata.
# ===========================================================================


def _incarichi_attivi(db: Session, azienda_id: UUID, ruoli_codici: frozenset[str]) -> list[PerIncarico]:
    sotto_query_cessati = (
        select(PerIncaricoValore.incarico_id)
        .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == PerIncaricoValore.caratteristica_id)
        .where(CatCaratteristicaIncarico.codice == "A02", PerIncaricoValore.valore_data.is_not(None))
    )
    return list(
        db.scalars(
            select(PerIncarico)
            .join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id)
            .where(
                PerIncarico.azienda_id == azienda_id,
                CatRuolo.codice.in_(ruoli_codici),
                PerIncarico.id.not_in(sotto_query_cessati),
            )
        ).all()
    )


def cessa_incarichi(db: Session, incarichi: list[PerIncarico]) -> None:
    """Cessa (§ commento in testa al modulo: aggiornamento della riga
    esistente, mai un DELETE) tutti gli incarichi passati, valorizzando A02
    "Data cessazione" a oggi. Usata dalla Correzione 12 dopo che l'utente ha
    confermato esplicitamente la cessazione — mai chiamata senza conferma."""
    oggi = date.today().isoformat()
    for incarico in incarichi:
        valida_e_salva_valori(db, incarico, {"A02": oggi}, parziale=True)


# ===========================================================================
# Amministratore unico: al più un incarico attivo alla volta (Correzione 05)
# ===========================================================================
RUOLI_AMMINISTRATORI_ORGANO = frozenset({"AMMINISTRATORE", "AMMINISTRATORE_DELEGATO", "COMPONENTE_CDA"})


def verifica_amministratore_unico_disponibile(db: Session, azienda_id: UUID, ruolo_codice: str) -> None:
    """§ Correzione 05 punto 10: quando l'organo amministrativo in carica è
    "Amministratore unico", il pulsante "Aggiungi riga" non deve consentire
    il salvataggio di un secondo amministratore ancora attivo — la
    sostituzione (cessazione/storicizzazione del precedente) è una
    funzionalità futura, non implementata qui: per ora si blocca con un
    errore invece di sovrascrivere silenziosamente (§ vincoli punto 13).

    No-op per ogni ruolo diverso da quelli amministrativi e per ogni organo
    diverso da "Amministratore unico" (compreso "non disponibile")."""
    if ruolo_codice not in RUOLI_AMMINISTRATORI_ORGANO:
        return

    amministrazione = db.scalars(
        select(AnaAmministrazioneControllo).where(AnaAmministrazioneControllo.azienda_id == azienda_id)
    ).first()
    if amministrazione is None or amministrazione.organo_amministrativo_id is None:
        return
    organo = db.get(CatOrganoAmministrativo, amministrazione.organo_amministrativo_id)
    if organo is None or organo.codice != "AMMINISTRATORE_UNICO":
        return

    if _incarichi_attivi(db, azienda_id, RUOLI_AMMINISTRATORI_ORGANO):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "È già presente un amministratore unico in carica: per sostituirlo, cessare prima l'incarico esistente.",
        )


# ===========================================================================
# Nessun organo di controllo o revisore: cessazione confermata degli
# incarichi esistenti (Correzione 12)
# ===========================================================================
RUOLI_ORGANO_CONTROLLO = frozenset({"SINDACO", "REVISORE_LEGALE"})


def incarichi_organo_controllo_attivi(db: Session, azienda_id: UUID) -> list[PerIncarico]:
    return _incarichi_attivi(db, azienda_id, RUOLI_ORGANO_CONTROLLO)


def verifica_transizione_nessun_organo_controllo(
    db: Session, azienda_id: UUID, *, row: object | None, nuovo_codice: str | None, confermata: bool
) -> None:
    """§ Correzione 12: quando "Assetto di controllo in carica" passa a
    "Nessun organo di controllo o revisore" e ci sono ancora sindaci/
    revisori attivi, il salvataggio non deve cancellare o storicizzare
    nulla silenziosamente — richiede una conferma esplicita del chiamante
    (`confermata`, propagata dal PATCH della sezione) e solo allora cessa
    gli incarichi attivi (A02 = oggi), nella stessa transazione del
    salvataggio della sezione (chiamata da `salva_sezione` prima del
    commit, mai a parte: § "operazioni composite = transazione unica").

    No-op se il nuovo valore non è questo assetto, o se lo era già (nessuna
    transizione reale, nessun bisogno di riproporre la conferma ogni
    salvataggio successivo)."""
    if nuovo_codice != "NESSUN_ORGANO_CONTROLLO":
        return

    precedente_codice = None
    if row is not None and getattr(row, "assetto_controllo_id", None) is not None:
        precedente = db.get(CatAssettoControllo, row.assetto_controllo_id)
        precedente_codice = precedente.codice if precedente is not None else None
    if precedente_codice == "NESSUN_ORGANO_CONTROLLO":
        return

    attivi = incarichi_organo_controllo_attivi(db, azienda_id)
    if not attivi:
        return
    if not confermata:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={
                "code": "CESSAZIONE_ORGANO_CONTROLLO_RICHIESTA",
                "message": (
                    f"Risultano {len(attivi)} sindaci/revisori ancora in carica. Confermando, gli incarichi "
                    "esistenti verranno cessati (data di cessazione impostata a oggi)."
                ),
                "count": len(attivi),
            },
        )
    cessa_incarichi(db, attivi)


# ===========================================================================
# Sindaco unico: sostituzione confermata di un incarico già in carica
# (Correzione 13)
# ===========================================================================


def verifica_sindaco_unico_disponibile(db: Session, azienda_id: UUID, ruolo_codice: str, *, confermata: bool) -> None:
    """§ Correzione 13: quando l'assetto di controllo in carica è "Sindaco
    unico" e ne esiste già uno attivo, l'inserimento di un nuovo sindaco
    unico è una SOSTITUZIONE (cessazione/storicizzazione del precedente,
    § testo esplicito "deve essere gestito come sostituzione"), non un
    secondo incarico attivo in parallelo — a differenza
    dell'amministratore unico (Correzione 05, tuttora bloccato senza
    percorso di conferma: "funzionalità futura, non implementata qui"),
    qui la sostituzione è implementata per davvero: richiede conferma
    esplicita del chiamante (stesso pattern a due tentativi di
    `verifica_transizione_nessun_organo_controllo`, § Correzione 12) e,
    solo allora, cessa il precedente (A02 = oggi) nella stessa transazione
    della creazione del nuovo incarico (chiamata da `create_incarico`
    prima del commit).

    No-op per ogni ruolo diverso da SINDACO e per ogni assetto diverso da
    "Sindaco unico" (compreso "non disponibile")."""
    if ruolo_codice != "SINDACO":
        return

    organi_controllo = db.scalars(
        select(AnaOrganiControllo).where(AnaOrganiControllo.azienda_id == azienda_id)
    ).first()
    if organi_controllo is None or organi_controllo.assetto_controllo_id is None:
        return
    assetto = db.get(CatAssettoControllo, organi_controllo.assetto_controllo_id)
    if assetto is None or assetto.codice != "SINDACO_UNICO":
        return

    attivi = _incarichi_attivi(db, azienda_id, frozenset({"SINDACO"}))
    if not attivi:
        return
    if not confermata:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={
                "code": "SOSTITUZIONE_SINDACO_UNICO_RICHIESTA",
                "message": (
                    "È già presente un sindaco unico in carica. Confermando, l'incarico esistente verrà "
                    "cessato (data di cessazione impostata a oggi) e sostituito da questo nuovo incarico."
                ),
            },
        )
    cessa_incarichi(db, attivi)


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
