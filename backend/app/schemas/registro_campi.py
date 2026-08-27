"""Schemi del "registro campo-per-campo": verifica e visibilita' per singolo
campo di una sezione (§7.1/§15 della specifica Anagrafica Aziendale). Vedi
`app.core.registro_campi` per la logica che li popola."""

from typing import Literal

from pydantic import BaseModel

VerificationStatus = Literal["PENDING_VERIFICATION", "VERIFIED", "REVISION_REQUIRED"]
CompletionStatus = Literal["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]
ReviewDecisionCodice = Literal["VERIFIED", "REVISION_REQUIRED"]


class FieldOptionRead(BaseModel):
    """Una voce del menu a tendina di un campo `dataType: "catalogo"`
    (Correzione 04): `code` è il valore stabile da inviare/confrontare,
    `label` il testo da mostrare — il frontend non scrive mai le opzioni a
    mano, arrivano da qui."""

    code: str
    label: str


class FieldStateRead(BaseModel):
    key: str
    label: str
    value: str | None
    dataType: str
    # Solo per dataType "catalogo": le opzioni attive del catalogo che
    # sostiene il campo, nell'ordine in cui vanno mostrate nel menu a
    # tendina. None per ogni altro dataType.
    options: list[FieldOptionRead] | None = None
    # False per i campi derivati (es. "Sede legale", "Capitale sociale
    # rappresentato": nessuna colonna propria, valore letto da un'altra
    # sezione): la sezione lo mostra ma non lo accetta in scrittura via
    # PATCH. Tutti gli altri campi sono editable=True.
    editable: bool = True
    visibleToCompany: bool
    verificationStatus: VerificationStatus | None
    # Ancora di concorrenza ottimistica per la decisione di verifica
    # (expectedFieldVersion in ReviewDecisionRequest): None solo per i campi
    # vuoti, dove non esiste una decisione da poter prendere.
    verificationVersion: int | None = None
    revisionNote: str | None = None
    updatedAt: str | None = None
    # Presenti solo quando lo stato corrente è VERIFIED (§9.4/§22.1 del
    # prompt master Anagrafica Aziendale): data e autore dell'ultima verifica
    # valida per il valore attuale del campo.
    verifiedAt: str | None = None
    verifiedBy: str | None = None
    # Solo per campi derivati (editable=False): nome della sezione sorgente
    # per il suggerimento "Si modifica dalla sezione ...". sourceHref è
    # None quando la sorgente non ha una pagina/route propria da linkare.
    sourceLabel: str | None = None
    sourceHref: str | None = None
    # Solo per campi derivati calcolati automaticamente (non "si modifica
    # altrove"): nota fissa mostrata al posto del messaggio "Si modifica
    # ..." quando sourceLabel non è impostato (es. "Determinato dall'organo
    # scelto" per "Numero componenti", § Correzione 05).
    derivedNote: str | None = None


class SectionGroupRead(BaseModel):
    key: str
    title: str
    fields: list[FieldStateRead]


class SectionRead(BaseModel):
    sectionKey: str
    title: str
    completionStatus: CompletionStatus
    groups: list[SectionGroupRead]
    # Ancora di concorrenza ottimistica (If-Match): ISO timestamp dell'ultimo
    # salvataggio del record di dominio, None se la sezione non e' mai stata
    # compilata (nessun record ancora creato).
    version: str | None


class SectionUpdateRequest(BaseModel):
    fields: dict[str, str | None]


class VisibilityUpdateRequest(BaseModel):
    visibleToCompany: bool


class ReviewDecisionRequest(BaseModel):
    decision: ReviewDecisionCodice
    note: str | None = None
    expectedFieldVersion: int | None = None


class QualitySummaryRead(BaseModel):
    verified: int
    pending: int
    revisionRequired: int
    # Percentuale sui soli campi già compilati (verified / compilati * 100):
    # la qualità misura quanto è affidabile il dato inserito, non quanto
    # manca da inserire — vedi `totalApplicable` per quest'ultimo.
    percentage: int
    # Dimensione dell'intero catalogo applicabile (compilato o no): usato
    # per sapere se una sezione è compilata per intero, separatamente dalla
    # qualità dei soli dati già presenti.
    totalApplicable: int
    # Campi oscurati con l'occhietto (visibile_azienda=false): sottratti da
    # `totalApplicable` da chi calcola il completamento di una sezione, cosi'
    # un campo nascosto e non compilato non blocca lo stato "verde".
    hidden: int


class SectionSummaryRead(BaseModel):
    """Conteggi di stato per una singola sezione (§6.4 del prototipo: la riga
    a tre pallini di ogni card della Home) — a differenza di
    `QualitySummaryRead`, che aggrega l'intero modulo."""

    sectionKey: str
    verified: int
    pending: int
    revisionRequired: int
    totalApplicable: int


class RecentChangeRead(BaseModel):
    id: str
    label: str
    timestamp: str
    actor: str | None


class OverviewRead(BaseModel):
    quality: QualitySummaryRead | None
    recentChanges: list[RecentChangeRead]
