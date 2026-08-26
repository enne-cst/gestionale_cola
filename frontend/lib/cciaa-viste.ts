// Le 10 card della griglia "Dati CCIAA" (§6.3 del protocollo, ordine della
// visura camerale). Ogni card apre un pannello nel workspace esistente
// (drawer 50% / affiancamento / tutta larghezza): la card "Capitale sociale"
// apre direttamente la sezione a registro `capitale-sociale`
// (SectionContent), le altre 9 aprono `CciaaSectionPanel`, che compone i
// gruppi a registro e le tabelle esistenti pertinenti (vedi
// components/registro/cciaa-section-panel.tsx per la composizione di
// ciascuna). Le chiavi qui sotto sono usate da `WorkspaceShell` per scegliere
// quale componente montare per un dato `sectionKey`.

export type CciaaVistaKey =
  | "sintesi"
  | "sede"
  | "statuto"
  | "soci"
  | "amministratori"
  | "sindaci"
  | "attivita-albi"
  | "personale-occupazione"
  | "sedi-secondarie"
  | "aggiornamento-impresa";

export const TITOLO_VISTA_CCIAA: Record<CciaaVistaKey, string> = {
  sintesi: "Dati della sintesi",
  sede: "Sede",
  statuto: "Informazioni da statuto/atto costitutivo",
  soci: "Soci e titolari di diritti su azioni e quote",
  amministratori: "Amministratori",
  sindaci: "Sindaci e membri degli organi di controllo",
  "attivita-albi": "Attività, albi, ruoli e licenze",
  "personale-occupazione": "Personale e occupazione",
  "sedi-secondarie": "Sedi secondarie e unità locali",
  "aggiornamento-impresa": "Aggiornamento impresa",
};

export const CCIAA_VISTA_KEYS: ReadonlySet<string> = new Set(Object.keys(TITOLO_VISTA_CCIAA));

export function isCciaaVistaKey(key: string): key is CciaaVistaKey {
  return CCIAA_VISTA_KEYS.has(key);
}
