// Nome del modulo così come atteso dal backend (vedi MODULO in
// backend/app/api/anagrafica.py) e usato come chiave nella configurazione
// della scheda Panoramica.
export const MODULO_ANAGRAFICA = "Anagrafica Aziendale";

export type SezioneAnagrafica = {
  slug: string;
  titolo: string;
  categoria: string;
};

// Elenco delle voci del modulo Anagrafica Aziendale già disponibili,
// raggruppate nelle 4 categorie mostrate nella panoramica e nella barra di
// navigazione: le informazioni societarie principali restano in evidenza,
// Sedi e Contatti hanno una categoria propria, mentre tutti gli altri dati
// estratti dalla visura camerale (cap. 3.2.1 del documento di progetto)
// confluiscono in "Dati CCIAA". Le sezioni di Organizzazione e Altre
// informazioni (cap. 3.2.2/3.2.3) verranno aggiunte qui via via che vengono
// sviluppate.
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
];

export function categoriaSlug(nome: string): string {
  return CATEGORIE_ANAGRAFICA.find((c) => c.nome === nome)?.slug ?? nome.toLowerCase();
}

export function sezioniPerCategoria(categoria: string): SezioneAnagrafica[] {
  return SEZIONI_ANAGRAFICA.filter((s) => s.categoria === categoria);
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
