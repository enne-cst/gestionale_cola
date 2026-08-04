// Anteprima "dal vivo" (titolo + sottotitolo) di un record fissato in
// Panoramica da una sezione a elenco: stessa logica già usata per le
// SectionListPreviewCard della panoramica del modulo, riportata qui perché
// la Panoramica personalizzata deve mostrare lo stato attuale del record,
// non l'etichetta congelata al momento del pin.

type Anteprima = { titolo: string; sottotitolo: string };

const ANTEPRIME: Record<string, (record: Record<string, unknown>) => Anteprima> = {
  sedi: (r) => ({
    titolo: (r.denominazione_sede as string) || (r.tipo_sede as string),
    sottotitolo: [r.indirizzo, r.comune].filter(Boolean).join(", ") || (r.tipo_sede as string) || "—",
  }),
  contatti: (r) => ({
    titolo: r.valore as string,
    sottotitolo: r.tipo_contatto as string,
  }),
  "iscrizioni-registro-imprese": (r) => ({
    titolo: (r.tipo_iscrizione as string) || "Iscrizione",
    sottotitolo: (r.sezione as string) || "—",
  }),
  "codici-ateco": (r) => ({
    titolo: r.codice as string,
    sottotitolo: (r.descrizione as string) || (r.ruolo_codice as string) || "—",
  }),
  "albi-ruoli-licenze": (r) => ({
    titolo: r.tipologia as string,
    sottotitolo: (r.stato as string) || "—",
  }),
  soa: (r) => ({
    titolo: (r.numero_attestazione as string) || "Attestazione",
    sottotitolo:
      ((r.categorie as { categoria: string }[] | undefined) ?? []).map((c) => c.categoria).join(", ") || "—",
  }),
  certificazioni: (r) => ({
    titolo: (r.tipologia_certificazione as string) || (r.sigla as string) || "Certificazione",
    sottotitolo: (r.norma_riferimento as string) || "—",
  }),
  "addetti-visura": (r) => ({
    titolo: r.anno_riferimento ? `Addetti ${r.anno_riferimento}` : "Rilevazione",
    sottotitolo: (r.fonte as string) || "—",
  }),
  "addetti-comune": (r) => ({
    titolo: r.comune as string,
    sottotitolo: (r.provincia as string) || "—",
  }),
};

export function anteprimaRecord(sezioneSlug: string, record: Record<string, unknown>): Anteprima {
  const fn = ANTEPRIME[sezioneSlug];
  return fn ? fn(record) : { titolo: String(record.id ?? ""), sottotitolo: "" };
}
