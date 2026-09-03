// Le 10 card della griglia "Dati CCIAA" (§6.3 del protocollo, ordine della
// visura camerale). Ogni card apre un pannello nel workspace esistente
// (drawer 50% / affiancamento / tutta larghezza): le card "Capitale sociale",
// "Sede" e "Informazioni da statuto/atto costitutivo" aprono direttamente la
// propria sezione a registro (SectionContent — `capitale-sociale`, `sede`,
// `statuto`, le ultime due sostenute da tabelle dedicate "rev2", vedi
// `backend/app/core/registro_campi.py::SEZIONE_SEDE`/`SEZIONE_STATUTO`), le
// altre 7 aprono `CciaaSectionPanel`, che compone i gruppi a registro e le
// tabelle esistenti pertinenti (vedi components/registro/cciaa-section-panel.tsx
// per la composizione di ciascuna). Le chiavi qui sotto sono usate da
// `WorkspaceShell` per scegliere quale componente montare per un dato
// `sectionKey`.

// § Correzione 25: "sintesi" resta una `CciaaVistaKey` valida (stesso
// pannello `CciaaSectionPanel`/`SintesiPanel`, stesso meccanismo di
// rendering di `WorkspaceShell`) ma non è più aperta da una card della
// griglia — si apre da `VisualizzaSintesiButton` nel banner "Dati CCIAA",
// con uno stato di workspace indipendente (`openSintesi`/`closeSintesi` in
// workspace-provider.tsx) che non tocca `mode`/`openSectionKey`. Nessuna
// sezione di `sys_elementi`, nessun contributo al conteggio "N di N
// sezioni completate" (vedi `page.tsx`, `cciaaCards` non la include più).
export type CciaaVistaKey =
  | "sintesi"
  | "soci"
  | "amministratori"
  | "sindaci"
  | "attivita-albi"
  | "personale-occupazione"
  | "sedi-secondarie"
  | "aggiornamento-impresa";

export const TITOLO_VISTA_CCIAA: Record<CciaaVistaKey, string> = {
  sintesi: "Dati della sintesi",
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
