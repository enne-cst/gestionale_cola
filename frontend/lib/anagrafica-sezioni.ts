export type SezioneAnagrafica = {
  slug: string;
  titolo: string;
  categoria: string;
};

// Elenco delle voci del modulo Anagrafica Aziendale già disponibili
// (cap. 3.2.1 del documento di progetto). Le altre sezioni previste dal
// documento verranno aggiunte qui via via che vengono sviluppate.
export const SEZIONI_ANAGRAFICA: SezioneAnagrafica[] = [
  { slug: "identificazione-camerale", titolo: "Identificazione camerale", categoria: "Informazioni societarie" },
  { slug: "durata-societa-esercizi", titolo: "Durata società ed esercizi", categoria: "Informazioni societarie" },
  { slug: "attivita-esercitata", titolo: "Attività esercitata", categoria: "Informazioni societarie" },
  { slug: "capitale-sociale", titolo: "Capitale sociale", categoria: "Informazioni societarie" },
  { slug: "sedi", titolo: "Sedi", categoria: "Sedi" },
  { slug: "contatti", titolo: "Contatti e recapiti", categoria: "Contatti" },
];

export function sezioneBySlug(slug: string): SezioneAnagrafica | undefined {
  return SEZIONI_ANAGRAFICA.find((s) => s.slug === slug);
}
