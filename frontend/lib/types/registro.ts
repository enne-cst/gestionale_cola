// Tipi del "registro campo-per-campo": verifica e visibilità per singolo
// campo di una sezione dell'Anagrafica Aziendale (vedi
// backend/app/schemas/registro_campi.py, stessa forma).

export type VerificationStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REVISION_REQUIRED";
export type CompletionStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

export type FieldOption = {
  code: string;
  label: string;
};

export type FieldState = {
  key: string;
  label: string;
  value: string | null;
  dataType: string;
  // Solo per dataType "catalogo": opzioni attive del catalogo che sostiene
  // il campo, nell'ordine in cui vanno mostrate nel menu a tendina. Mai
  // scritte a mano nel frontend (vedi backend/app/core/registro_campi.py).
  options: FieldOption[] | null;
  // false solo per il campo derivato "Sede legale" (nessuna colonna propria,
  // valore letto dal modulo Sedi): la sezione lo mostra ma non lo accetta in
  // scrittura da qui (vedi backend/app/core/registro_campi.py).
  editable: boolean;
  visibleToCompany: boolean;
  verificationStatus: VerificationStatus | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  updatedAt: string | null;
  // Presenti solo quando verificationStatus è "VERIFIED".
  verifiedAt: string | null;
  verifiedBy: string | null;
  // Solo per campi derivati (editable=false): nome della sezione/entità
  // sorgente per il suggerimento "Si modifica da ...". sourceHref è null
  // quando la sorgente non ha una pagina propria da linkare.
  sourceLabel: string | null;
  sourceHref: string | null;
  // Solo per campi derivati calcolati automaticamente (non "si modifica
  // altrove"): nota fissa mostrata al posto del messaggio "Si modifica ..."
  // quando sourceLabel è null (es. "Determinato dall'organo scelto").
  derivedNote: string | null;
  // Visibilità condizionata (§ Correzione 04/05): null = sempre applicabile.
  // Altrimenti questo campo è applicabile solo quando il campo
  // `dependsOn` (stessa sezione) ha un valore non vuoto — e, se
  // `dependsOnValues` è a sua volta impostato, solo quando quel valore è
  // uno dei codici indicati. La regola arriva dal backend (unica fonte),
  // il frontend la applica soltanto per decidere cosa mostrare, anche
  // prima di un salvataggio.
  dependsOn: string | null;
  dependsOnValues: string[] | null;
};

export type SectionGroup = {
  key: string;
  title: string;
  fields: FieldState[];
};

export type Section = {
  sectionKey: string;
  title: string;
  completionStatus: CompletionStatus;
  groups: SectionGroup[];
  version: string | null;
};

export type QualitySummary = {
  // Conteggi e percentuale sui soli campi già compilati (qualità del dato
  // inserito, non quanto manca): un campo mai toccato non incide qui.
  verified: number;
  pending: number;
  revisionRequired: number;
  percentage: number;
  // Dimensione dell'intero catalogo applicabile (compilato o no): per
  // sapere se una sezione è compilata per intero, separatamente dalla
  // qualità dei soli dati già presenti.
  totalApplicable: number;
  // Campi con visibleToCompany=false, compilati o no: da sottrarre a
  // totalApplicable per capire se una sezione è "completa" ignorando ciò
  // che il Consulente ha scelto di non mostrare ancora.
  hidden: number;
};

export type SectionSummary = {
  sectionKey: string;
  verified: number;
  pending: number;
  revisionRequired: number;
  totalApplicable: number;
};

export type RecentChange = {
  id: string;
  label: string;
  timestamp: string;
  actor: string | null;
};

export type RegistryOverview = {
  quality: QualitySummary | null;
  recentChanges: RecentChange[];
};
