// Nome del modulo così come atteso dal backend (vedi MODULO in
// backend/app/api/anagrafica.py) e usato come chiave nella configurazione
// della scheda Panoramica.
export const MODULO_ANAGRAFICA = "Anagrafica Aziendale";

export type SezioneAnagrafica = {
  slug: string;
  titolo: string;
  categoria: string;
  // Codice sys_elementi.codice (cap. 4.1 punto 013 del documento di
  // progetto): presente solo per le sezioni soggette ad abbonamento. Se
  // assente, la sezione è sempre visibile (fa parte del modulo base).
  codice?: string;
};

// Elenco delle voci del modulo Anagrafica Aziendale, raggruppate per
// categoria mostrata nella panoramica e nella barra di navigazione: le
// informazioni societarie principali restano in evidenza, Sedi e Contatti
// hanno una categoria propria, i dati estratti dalla visura camerale (cap.
// 3.2.1) confluiscono in "Dati CCIAA". Organizzazione, Trend, Assicurazioni
// e Altre informazioni (cap. 4.2.2/4.2.3) sono soggette all'abbonamento
// ISO 9001: `sezioniVisibili`/`categorieVisibili` sotto le filtrano in base
// a `GET /api/sezioni`.
export const SEZIONI_ANAGRAFICA: SezioneAnagrafica[] = [
  { slug: "identificazione-camerale", titolo: "Identificazione camerale", categoria: "Informazioni societarie" },
  { slug: "durata-societa-esercizi", titolo: "Durata società ed esercizi", categoria: "Informazioni societarie" },
  { slug: "attivita-esercitata", titolo: "Attività esercitata", categoria: "Informazioni societarie" },
  { slug: "capitale-sociale", titolo: "Capitale sociale", categoria: "Informazioni societarie" },
  { slug: "sedi", titolo: "Sedi", categoria: "Sedi" },
  { slug: "contatti", titolo: "Contatti e recapiti", categoria: "Contatti" },
  { slug: "iscrizioni-registro-imprese", titolo: "Iscrizioni registro imprese", categoria: "Dati CCIAA" },
  { slug: "codici-ateco", titolo: "Codici ATECO", categoria: "Dati CCIAA" },
  { slug: "amministrazione-controllo", titolo: "Amministrazione e controllo", categoria: "Dati CCIAA" },
  { slug: "albi-ruoli-licenze", titolo: "Albi, ruoli e licenze", categoria: "Dati CCIAA" },
  { slug: "soa", titolo: "Attestazioni SOA", categoria: "Dati CCIAA" },
  { slug: "certificazioni", titolo: "Certificazioni possedute", categoria: "Dati CCIAA" },
  { slug: "addetti-visura", titolo: "Addetti da visura", categoria: "Dati CCIAA" },
  { slug: "addetti-comune", titolo: "Addetti per comune", categoria: "Dati CCIAA" },

  // --- Organizzazione (ISO 9001) ---
  {
    slug: "contratto-lavoro",
    titolo: "Contratto di lavoro",
    categoria: "Organizzazione",
    codice: "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO",
  },
  {
    slug: "posizioni-assicurative-previdenziali",
    titolo: "Posizioni assicurative e previdenziali",
    categoria: "Organizzazione",
    codice: "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI",
  },
  {
    slug: "fondi-interprofessionali",
    titolo: "Fondi interprofessionali",
    categoria: "Organizzazione",
    codice: "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE",
  },
  {
    slug: "dati-generali",
    titolo: "Dati generali del personale",
    categoria: "Organizzazione",
    codice: "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI",
  },
  {
    slug: "turni-lavoro",
    titolo: "Turni di lavoro",
    categoria: "Organizzazione",
    codice: "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO",
  },
  {
    slug: "outsourcing",
    titolo: "Outsourcing",
    categoria: "Organizzazione",
    codice: "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING",
  },
  {
    slug: "subappaltatori",
    titolo: "Subappaltatori",
    categoria: "Organizzazione",
    codice: "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI",
  },
  {
    slug: "fornitori-materiali",
    titolo: "Fornitori di materiali",
    categoria: "Organizzazione",
    codice: "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI",
  },
  {
    slug: "lavoratori-autonomi",
    titolo: "Lavoratori autonomi",
    categoria: "Organizzazione",
    codice: "ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI",
  },

  // --- Trend (ISO 9001) ---
  {
    slug: "ripartizione-organico",
    titolo: "Ripartizione organico",
    categoria: "Trend",
    codice: "ANAGRAFICA_AZIENDALE.TREND.RIPARTIZIONE_ORGANICO",
  },
  {
    slug: "indicatori-economici",
    titolo: "Indicatori economici",
    categoria: "Trend",
    codice: "ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI",
  },
  {
    slug: "variazioni-organico",
    titolo: "Variazioni organico",
    categoria: "Trend",
    codice: "ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO",
  },

  // --- Assicurazioni (ISO 9001) ---
  {
    slug: "assicurazioni",
    titolo: "Polizze assicurative",
    categoria: "Assicurazioni",
    codice: "ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE",
  },

  // --- Altre informazioni (ISO 9001) ---
  {
    slug: "contratti-rete",
    titolo: "Contratti di rete",
    categoria: "Altre informazioni",
    codice: "ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI",
  },
  {
    slug: "compliance-trasparenza",
    titolo: "Compliance e trasparenza",
    categoria: "Altre informazioni",
    codice: "ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE",
  },
  {
    slug: "procedimenti-legali",
    titolo: "Procedimenti legali",
    categoria: "Altre informazioni",
    codice: "ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI",
  },
  {
    slug: "visite-enti-controllo",
    titolo: "Visite enti di controllo",
    categoria: "Altre informazioni",
    codice: "ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO",
  },
];

export function sezioneBySlug(slug: string): SezioneAnagrafica | undefined {
  return SEZIONI_ANAGRAFICA.find((s) => s.slug === slug);
}

export type CategoriaAnagrafica = {
  nome: string;
  slug: string;
};

// Ordine di visualizzazione delle categorie nella tab bar e nella
// panoramica. Lo slug è usato come ancora (#slug) per saltare alla sezione
// corrispondente della panoramica dalle altre pagine del modulo.
export const CATEGORIE_ANAGRAFICA: CategoriaAnagrafica[] = [
  { nome: "Informazioni societarie", slug: "informazioni-societarie" },
  { nome: "Sedi", slug: "sedi" },
  { nome: "Contatti", slug: "contatti" },
  { nome: "Dati CCIAA", slug: "dati-cciaa" },
  { nome: "Organizzazione", slug: "organizzazione" },
  { nome: "Trend", slug: "trend" },
  { nome: "Assicurazioni", slug: "assicurazioni" },
  { nome: "Altre informazioni", slug: "altre-informazioni" },
];

export function categoriaSlug(nome: string): string {
  return CATEGORIE_ANAGRAFICA.find((c) => c.nome === nome)?.slug ?? nome.toLowerCase();
}

export function sezioniPerCategoria(categoria: string): SezioneAnagrafica[] {
  return SEZIONI_ANAGRAFICA.filter((s) => s.categoria === categoria);
}

// --- Filtro per abbonamento (GET /api/sezioni) ---
// Una sezione senza `codice` è sempre visibile (modulo base). Una sezione
// con `codice` lo è solo se compare tra le sezioni abilitate per l'azienda
// corrente: stessa regola applicata dal backend (app/core/sezioni.py), qui
// solo a scopo di presentazione — l'accesso resta comunque bloccato lato
// API anche se il frontend venisse aggirato (doc. cap. 2.3.1).
export function sezioneVisibile(sezione: SezioneAnagrafica, sezioniAbilitate: Set<string>): boolean {
  return sezione.codice === undefined || sezioniAbilitate.has(sezione.codice);
}

export function sezioniPerCategoriaVisibili(categoria: string, sezioniAbilitate: Set<string>): SezioneAnagrafica[] {
  return sezioniPerCategoria(categoria).filter((s) => sezioneVisibile(s, sezioniAbilitate));
}

export function categorieVisibili(sezioniAbilitate: Set<string>): CategoriaAnagrafica[] {
  return CATEGORIE_ANAGRAFICA.filter((c) => sezioniPerCategoriaVisibili(c.nome, sezioniAbilitate).length > 0);
}

// Nome dell'evento custom con cui la tab bar (AnagraficaNav) segnala a
// CollapsibleSection di riaprirsi quando l'utente clicca una categoria che
// era stata compattata: un semplice cambio di hash via Link non basta,
// perché la navigazione lato client di Next.js non genera sempre un evento
// 'hashchange' nativo.
export const ESPANDI_SEZIONE_EVENT = "anagrafica:espandi-sezione";

// Eventi broadcast per i pulsanti "Espandi tutte" / "Comprimi tutte" della
// panoramica: riaprono o richiudono tutte le categorie indipendentemente da
// quale sia stata cliccata.
export const ESPANDI_TUTTE_EVENT = "anagrafica:espandi-tutte";
export const COMPRIMI_TUTTE_EVENT = "anagrafica:comprimi-tutte";
