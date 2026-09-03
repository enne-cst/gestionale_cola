// Le 14 sezioni ISO 9001 "a elenco" (più record per azienda, § "falle
// tutte"): a differenza delle sezioni a registro campo-per-campo (un solo
// record per azienda), qui la verifica del consulente è per riga
// (`app.core.verifica_riga`, stesso motore di Soci/Amministratori/Sindaci),
// ma l'apertura nel workspace (drawer 50%/affiancamento/scheda) è la
// stessa — vedi `components/registro/section-or-cciaa-panel.tsx`, che
// sceglie `ElencoIso9001Panel` per queste chiavi.
export type ElencoIso9001Key =
  | "fondi-interprofessionali"
  | "dati-generali"
  | "outsourcing"
  | "subappaltatori"
  | "fornitori-materiali"
  | "lavoratori-autonomi"
  | "ripartizione-organico"
  | "indicatori-economici"
  | "variazioni-organico"
  | "assicurazioni"
  | "contratti-rete"
  | "compliance-trasparenza"
  | "procedimenti-legali"
  | "visite-enti-controllo";

export const TITOLO_ELENCO_ISO9001: Record<ElencoIso9001Key, string> = {
  "fondi-interprofessionali": "Fondi interprofessionali",
  "dati-generali": "Dati generali del personale",
  outsourcing: "Outsourcing",
  subappaltatori: "Subappaltatori",
  "fornitori-materiali": "Fornitori di materiali",
  "lavoratori-autonomi": "Lavoratori autonomi",
  "ripartizione-organico": "Ripartizione organico",
  "indicatori-economici": "Indicatori economici",
  "variazioni-organico": "Variazioni organico",
  assicurazioni: "Polizze assicurative",
  "contratti-rete": "Contratti di rete",
  "compliance-trasparenza": "Compliance e trasparenza",
  "procedimenti-legali": "Procedimenti legali",
  "visite-enti-controllo": "Visite enti di controllo",
};

export const SOTTOTITOLO_ELENCO_ISO9001: Record<ElencoIso9001Key, string> = {
  "fondi-interprofessionali": "Storico delle iscrizioni ai fondi interprofessionali",
  "dati-generali": "Fotografia annuale dell'organico aziendale al 31 dicembre",
  outsourcing: "Processi e attività che l'azienda affida a soggetti esterni",
  subappaltatori: "Subappaltatori utilizzati dall'azienda",
  "fornitori-materiali": "Fornitori di materiali utilizzati dall'azienda",
  "lavoratori-autonomi": "Lavoratori autonomi e professionisti esterni che collaborano con l'azienda",
  "ripartizione-organico": "Composizione dell'organico per ruolo, genere, nazionalità, contratto e titolo di studio",
  "indicatori-economici": "Andamento annuale di fatturato e obiettivo",
  "variazioni-organico": "Assunzioni, cessazioni e obiettivo di variazione dell'organico",
  assicurazioni: "Tutte le polizze assicurative dell'azienda",
  "contratti-rete": "Adesione dell'azienda a reti d'impresa e relativi contratti",
  "compliance-trasparenza": "Documenti, modelli e adempimenti in materia di compliance e trasparenza",
  "procedimenti-legali": "Procedimenti legali che coinvolgono l'azienda",
  "visite-enti-controllo": "Visite e verifiche effettuate dagli enti di controllo presso l'azienda",
};

export const ELENCO_ISO9001_KEYS: ReadonlySet<string> = new Set(Object.keys(TITOLO_ELENCO_ISO9001));

export function isElencoIso9001Key(key: string): key is ElencoIso9001Key {
  return ELENCO_ISO9001_KEYS.has(key);
}
