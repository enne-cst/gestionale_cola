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

  // --- Sezioni ISO 9001 "a elenco" (§ richiesta esplicita 05/09/2026) ---
  assicurazioni: (r) => ({
    titolo: (r.tipologia_polizza as string) || "Polizza",
    sottotitolo: (r.compagnia_assicurativa as string) || "—",
  }),
  "contratti-rete": (r) => ({
    titolo: (r.nome_contratto as string) || "Contratto di rete",
    sottotitolo: (r.numero_registrazione as string) || "—",
  }),
  "compliance-trasparenza": (r) => ({
    titolo: (r.elemento as string) || "Elemento",
    sottotitolo: r.presenza ? "Presente" : "Non presente",
  }),
  "procedimenti-legali": (r) => ({
    titolo: (r.tipologia_procedimento as string) || "Procedimento",
    sottotitolo: (r.controparte as string) || "—",
  }),
  "visite-enti-controllo": (r) => ({
    titolo: (r.ente as string) || "Visita",
    sottotitolo: (r.tipologia_visita as string) || "—",
  }),
  "variazioni-organico": (r) => ({
    titolo: r.anno_riferimento ? `Variazioni organico ${r.anno_riferimento}` : "Variazioni organico",
    sottotitolo: "—",
  }),
  "indicatori-economici": (r) => ({
    titolo: r.anno_riferimento ? `Indicatori economici ${r.anno_riferimento}` : "Indicatori economici",
    sottotitolo: "—",
  }),
  "ripartizione-organico": (r) => ({
    titolo: r.anno_riferimento ? `Ripartizione organico ${r.anno_riferimento}` : "Ripartizione organico",
    sottotitolo: "—",
  }),
  "lavoratori-autonomi": (r) => ({
    titolo: (r.nominativo_ragione_sociale as string) || "Lavoratore autonomo",
    sottotitolo: (r.mansione as string) || "—",
  }),
  "fornitori-materiali": (r) => ({
    titolo: (r.ragione_sociale as string) || "Fornitore",
    sottotitolo: (r.categoria_merceologica as string) || "—",
  }),
  subappaltatori: (r) => ({
    titolo: (r.ragione_sociale as string) || "Subappaltatore",
    sottotitolo: (r.categoria_lavori as string) || "—",
  }),
  outsourcing: (r) => ({
    titolo: (r.processo_attivita_affidata as string) || "Outsourcing",
    sottotitolo: (r.referente_interno as string) || "—",
  }),
  "dati-generali": (r) => ({
    titolo: r.anno_riferimento ? `Dati generali ${r.anno_riferimento}` : "Dati generali",
    sottotitolo: "—",
  }),
  "fondi-interprofessionali": (r) => ({
    titolo: (r.fondo_interprofessionale as string) || "Fondo interprofessionale",
    sottotitolo: (r.codice_fondo as string) || "—",
  }),

  // --- Righe delle card CCIAA rev2 (§ richiesta esplicita 05/09/2026) ---
  // Soci/Amministratori/Sindaci condividono la stessa forma `Incarico`
  // (persona o persona giuridica, mai entrambe — § Correzione 16).
  "elenco-soci-estremi": (r) => anteprimaIncarico(r),
  "amministrazione-controllo": (r) => anteprimaIncarico(r),
  "organi-controllo": (r) => anteprimaIncarico(r),
  // Titoli abilitativi (Albo/Ruolo/Licenza/Certificazione unificati, §
  // Correzione 20) e Unità locali (§ Correzione 23): stesso sectionKey
  // usato anche dai campi FieldRow della card omonima, ma qui si tratta
  // sempre di un `record_id`, mai un `campo` — nessuna ambiguità.
  "attivita-economica": (r) => ({
    titolo: (r.tipologia_label as string) || "Titolo abilitativo",
    sottotitolo: (r.numero_attestazione as string) || (r.ente_rilascio as string) || "—",
  }),
  "unita-locali": (r) => ({
    titolo: (r.riferimento_cciaa as string) || (r.indirizzo_label as string) || "Unità locale",
    sottotitolo: (r.tipologia_label as string) || "—",
  }),
};

function anteprimaIncarico(r: Record<string, unknown>): Anteprima {
  const persona = r.persona as { cognome: string; nome: string } | null;
  const personaGiuridica = r.persona_giuridica as { denominazione: string } | null;
  const ruolo = r.ruolo as { denominazione: string } | undefined;
  const titolo = persona ? `${persona.cognome} ${persona.nome}` : (personaGiuridica?.denominazione ?? "Incarico");
  return { titolo, sottotitolo: ruolo?.denominazione ?? "—" };
}

export function anteprimaRecord(sezioneSlug: string, record: Record<string, unknown>): Anteprima {
  const fn = ANTEPRIME[sezioneSlug];
  return fn ? fn(record) : { titolo: String(record.id ?? ""), sottotitolo: "" };
}
