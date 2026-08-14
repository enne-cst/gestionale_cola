// Tipi del "registro campo-per-campo": verifica e visibilità per singolo
// campo di una sezione dell'Anagrafica Aziendale (vedi
// backend/app/schemas/registro_campi.py, stessa forma).

export type VerificationStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REVISION_REQUIRED";
export type CompletionStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

export type FieldState = {
  key: string;
  label: string;
  value: string | null;
  dataType: string;
  // false solo per il campo derivato "Sede legale" (nessuna colonna propria,
  // valore letto dal modulo Sedi): la sezione lo mostra ma non lo accetta in
  // scrittura da qui (vedi backend/app/core/registro_campi.py).
  editable: boolean;
  visibleToCompany: boolean;
  verificationStatus: VerificationStatus | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  updatedAt: string | null;
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
  verified: number;
  pending: number;
  revisionRequired: number;
  percentage: number;
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
