import { Building2 } from "lucide-react";

import { ExpandAllButton } from "@/components/expand-all-button";
import { CciaaMacroSection } from "@/components/registro/cciaa-macro-section";
import { CciaaSectionCard, type CciaaSectionCardStato } from "@/components/registro/cciaa-section-card";
import { CompletionCard, type ProssimaSezioneDaCompletare } from "@/components/registro/completion-card";
import { MacroStatoBadge } from "@/components/registro/macro-stato-badge";
import { QualityCard } from "@/components/registro/quality-card";
import { RecentChangesCard } from "@/components/registro/recent-changes-card";
import { VisualizzaSintesiButton } from "@/components/registro/visualizza-sintesi-button";
import { WorkspaceProvider } from "@/components/registro/workspace-provider";
import { WorkspaceShell } from "@/components/registro/workspace-shell";
import { SectionPreviewGridCard } from "@/components/section-preview-grid-card";
import { apiFetch } from "@/lib/api";
import { getIncarichi } from "@/lib/actions/personale";
import { getRegistroOverview, getRiepilogoSezioni } from "@/lib/actions/registro";
import { CATEGORIA_ICONE, CCIAA_CARD_ICONE, SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { categoriaSlug, categorieVisibili, SEZIONI_ANAGRAFICA, sezioniPerCategoriaVisibili } from "@/lib/anagrafica-sezioni";
import { isElencoIso9001Key, type ElencoIso9001Key } from "@/lib/elenco-iso9001";
import type { MeResponse } from "@/lib/types/auth";
import type {
  AddettiComune,
  AddettiVisura,
  CronologiaEvento,
  PersonaleOccupazioneRiepilogo,
  TitoloAbilitativoSummary,
  UnitaLocaleSummary,
} from "@/lib/types/anagrafica";
import type {
  Assicurazione,
  ComplianceTrasparenza,
  ConVerificaRiga,
  ContrattiRetePresenza,
  ContrattoRete,
  DatiGenerali,
  FondoInterprofessionale,
  FornitoreMateriali,
  IndicatoreEconomico,
  LavoratoreAutonomo,
  Outsourcing,
  ProcedimentoLegale,
  RipartizioneOrganico,
  Subappaltatore,
  VariazioneOrganico,
  VisitaEnteControllo,
} from "@/lib/types/anagrafica-iso9001";

const RUOLI_AMMINISTRATORI = new Set(["AMMINISTRATORE", "AMMINISTRATORE_DELEGATO", "COMPONENTE_CDA"]);
const RUOLI_SINDACI = new Set(["SINDACO", "REVISORE_LEGALE"]);

export default async function AnagraficaOverviewPage() {
  const [me, overview] = await Promise.all([apiFetch<MeResponse>("/api/auth/me"), getRegistroOverview()]);
  const ruolo = me.profilo === "CONSULENTE" ? "CONSULENTE" : "AZIENDA";

  const [
    sezioniAbilitate,
    addettiVisura,
    addettiComune,
    titoliAbilitativi,
    unitaLocali,
    personaleOccupazioneRiepilogo,
    cronologiaAggiornamenti,
    riepilogoSezioni,
    incarichi,
  ] = await Promise.all([
    apiFetch<string[]>("/api/sezioni"),
    apiFetch<AddettiVisura[]>("/api/anagrafica/addetti-visura"),
    apiFetch<AddettiComune[]>("/api/anagrafica/addetti-comune"),
    apiFetch<TitoloAbilitativoSummary[]>("/api/anagrafica/titoli-abilitativi"),
    apiFetch<UnitaLocaleSummary[]>("/api/anagrafica/unita-locali"),
    apiFetch<PersonaleOccupazioneRiepilogo>("/api/anagrafica/personale-occupazione/riepilogo"),
    apiFetch<CronologiaEvento[]>("/api/anagrafica/aggiornamento-impresa/cronologia"),
    getRiepilogoSezioni(),
    getIncarichi(),
  ]);

  const riepilogoPerSezione = new Map(riepilogoSezioni.map((r) => [r.sectionKey, r]));

  // Presenza reale della card "Personale e occupazione" (§18, mai pallini/
  // percentuali inventati): quella card somma due tabelle, non ha un'unica
  // sezione a registro da interrogare per "informazioni presenti".
  const stato: Record<string, boolean> = {
    "addetti-visura": addettiVisura.length > 0,
    "addetti-comune": addettiComune.length > 0,
  };
  const sezioniAbilitateSet = new Set(sezioniAbilitate);

  // --- Conteggi delle 10 card "Dati CCIAA" (§6.3/§6.4 del protocollo) ---
  // Solo le sezioni realmente a registro hanno uno stato di verifica per
  // campo: le altre card mostrano presenza reale ("N di N informazioni
  // presenti"), mai pallini inventati (§18).
  function sommaRegistro(sectionKeys: string[]) {
    let verified = 0;
    let pending = 0;
    let revisionRequired = 0;
    let totalApplicable = 0;
    for (const key of sectionKeys) {
      const r = riepilogoPerSezione.get(key);
      if (!r) continue;
      verified += r.verified;
      pending += r.pending;
      revisionRequired += r.revisionRequired;
      totalApplicable += r.totalApplicable;
    }
    return { verified, pending, revisionRequired, totalApplicable };
  }
  function statoDaRegistro(agg: ReturnType<typeof sommaRegistro>): CciaaSectionCardStato {
    return { confermate: agg.verified, daVerificare: agg.pending, daRevisionare: agg.revisionRequired };
  }
  // Soci/Amministratori/Sindaci, titoli abilitativi, unità locali,
  // personale e occupazione, aggiornamento impresa e le sezioni "a elenco"
  // ISO 9001 non hanno un registro campo-per-campo, ma ogni record porta
  // comunque una verifica reale del consulente sulla riga
  // (`app.core.verifica_riga`, non più la caratteristica A32 nel form): i
  // pallini qui sotto aggregano quel dato esistente, non ne inventano uno
  // nuovo (§18). Restituisce sempre l'oggetto (mai `null`, anche a tabella
  // vuota): stessa convenzione delle sezioni a registro campo-per-campo,
  // dove una sezione mai compilata mostra comunque "0 confermate/0 da
  // verificare/0 da revisionare" invece di nascondere la riga dei pallini —
  // coerenza tra i due meccanismi di verifica, § richiesta esplicita.
  function statoDaRighe(righe: { verificationStatus: string | null }[]): CciaaSectionCardStato {
    let confermate = 0;
    let daVerificare = 0;
    let daRevisionare = 0;
    for (const r of righe) {
      if (r.verificationStatus === "VERIFIED") confermate += 1;
      else if (r.verificationStatus === "REVISION_REQUIRED") daRevisionare += 1;
      else daVerificare += 1;
    }
    return { confermate, daVerificare, daRevisionare };
  }
  // Alcune card compongono più fonti di verifica indipendenti (es.
  // "Amministratori" = tabella incarichi + campi della sezione a registro
  // "amministrazione-controllo", montati insieme nello stesso drawer — vedi
  // `VISTA_FOOTER_SECTION_KEY` in cciaa-section-panel.tsx): i pallini della
  // card devono sommarle entrambe, altrimenti "Qualità dei dati" (che le
  // conta entrambe) non torna mai con la somma dei pallini visibili in
  // pagina (§ richiesta esplicita 05/09/2026).
  function sommaStati(...stati: CciaaSectionCardStato[]): CciaaSectionCardStato {
    return stati.reduce(
      (tot, s) => ({
        confermate: tot.confermate + s.confermate,
        daVerificare: tot.daVerificare + s.daVerificare,
        daRevisionare: tot.daRevisionare + s.daRevisionare,
      }),
      { confermate: 0, daVerificare: 0, daRevisionare: 0 },
    );
  }

  const righeSoci = incarichi.filter((i) => i.ruolo.codice === "SOCIO");
  const righeAmministratori = incarichi.filter((i) => RUOLI_AMMINISTRATORI.has(i.ruolo.codice));
  const righeSindaci = incarichi.filter((i) => RUOLI_SINDACI.has(i.ruolo.codice));

  const aggStatuto = sommaRegistro(["statuto"]);
  const aggCapitale = sommaRegistro(["capitale-sociale"]);
  const aggSede = sommaRegistro(["sede"]);
  const aggUnitaLocali = sommaRegistro(["unita-locali"]);
  const aggAttivitaEconomica = sommaRegistro(["attivita-economica"]);
  const aggAmministrazioneControllo = sommaRegistro(["amministrazione-controllo"]);
  const aggElencoSociEstremi = sommaRegistro(["elenco-soci-estremi"]);
  const aggOrganiControllo = sommaRegistro(["organi-controllo"]);

  const cciaaCards: {
    key: string;
    sectionKey: string;
    titolo: string;
    presenti: number;
    totale: number;
    stato: CciaaSectionCardStato | null;
  }[] = [
    {
      key: "sede",
      sectionKey: "sede",
      titolo: "Sede",
      presenti: aggSede.verified + aggSede.pending + aggSede.revisionRequired,
      totale: aggSede.totalApplicable,
      stato: statoDaRegistro(aggSede),
    },
    {
      key: "statuto",
      sectionKey: "statuto",
      titolo: "Informazioni da statuto/atto costitutivo",
      presenti: aggStatuto.verified + aggStatuto.pending + aggStatuto.revisionRequired,
      totale: aggStatuto.totalApplicable,
      stato: statoDaRegistro(aggStatuto),
    },
    {
      key: "capitale-sociale",
      sectionKey: "capitale-sociale",
      titolo: "Capitale sociale",
      presenti: aggCapitale.verified + aggCapitale.pending + aggCapitale.revisionRequired,
      totale: aggCapitale.totalApplicable,
      stato: statoDaRegistro(aggCapitale),
    },
    {
      key: "soci",
      sectionKey: "soci",
      titolo: "Soci e titolari di diritti su azioni e quote",
      presenti: Number(righeSoci.length > 0),
      totale: 1,
      // La tabella incarichi e i campi di "elenco-soci-estremi" (numero
      // soci) sono montati nello stesso drawer (§ VISTA_FOOTER_SECTION_KEY):
      // i pallini sommano entrambe le fonti di verifica.
      stato: sommaStati(statoDaRighe(righeSoci), statoDaRegistro(aggElencoSociEstremi)),
    },
    {
      key: "amministratori",
      sectionKey: "amministratori",
      titolo: "Amministratori",
      presenti: Number(righeAmministratori.length > 0),
      totale: 1,
      stato: sommaStati(statoDaRighe(righeAmministratori), statoDaRegistro(aggAmministrazioneControllo)),
    },
    {
      key: "sindaci",
      sectionKey: "sindaci",
      titolo: "Sindaci e membri degli organi di controllo",
      presenti: Number(righeSindaci.length > 0),
      totale: 1,
      stato: sommaStati(statoDaRighe(righeSindaci), statoDaRegistro(aggOrganiControllo)),
    },
    {
      // § Correzione 19/20: la card usa oggi la sezione a registro
      // "attivita-economica" più la tabella unificata "titoli abilitativi"
      // (Codici ATECO/Albi/SOA/Certificazioni non sono più mostrati qui,
      // vedi cciaa-section-panel.tsx) — "informazioni presenti" segue quindi
      // i campi di "attivita-economica" come le altre card a registro, i
      // pallini sommano anche la verifica per riga dei titoli abilitativi.
      key: "attivita-albi",
      sectionKey: "attivita-albi",
      titolo: "Attività, albi, ruoli e licenze",
      presenti: aggAttivitaEconomica.verified + aggAttivitaEconomica.pending + aggAttivitaEconomica.revisionRequired,
      totale: aggAttivitaEconomica.totalApplicable,
      stato: sommaStati(statoDaRegistro(aggAttivitaEconomica), statoDaRighe(titoliAbilitativi)),
    },
    {
      key: "personale-occupazione",
      sectionKey: "personale-occupazione",
      titolo: "Personale e occupazione",
      presenti: Number(stato["addetti-visura"]) + Number(stato["addetti-comune"]),
      totale: 2,
      // § Correzione 22: la rilevazione più recente porta una propria
      // verifica (riepilogo calcolato su ana_addetti_visura*/comune*, non
      // una tabella nuova) — nessuna riga finché non esiste ancora nessuna
      // rilevazione.
      stato: statoDaRighe(personaleOccupazioneRiepilogo.rilevazione_id ? [personaleOccupazioneRiepilogo] : []),
    },
    {
      key: "sedi-secondarie",
      sectionKey: "sedi-secondarie",
      titolo: "Sedi secondarie e unità locali",
      presenti: aggUnitaLocali.verified + aggUnitaLocali.pending + aggUnitaLocali.revisionRequired,
      totale: aggUnitaLocali.totalApplicable,
      // Il campo "Numero unità locali dichiarato in visura" (registro) e la
      // verifica per riga di ogni unità locale sono due fonti distinte
      // (§ app/core/unita_locali.py) montate nello stesso drawer.
      stato: sommaStati(statoDaRegistro(aggUnitaLocali), statoDaRighe(unitaLocali)),
    },
    {
      // § Correzione 24: card ricostruita come cronologia automatica, 4
      // indicatori derivati e nessun campo compilabile — il conteggio
      // "informazioni presenti" di questa griglia non si applica più
      // (totale 0, mai nel denominatore di `cardCciaaCompletate`). Ogni
      // evento della cronologia porta comunque una propria verifica per
      // riga, riflessa nei pallini.
      key: "aggiornamento-impresa",
      sectionKey: "aggiornamento-impresa",
      titolo: "Aggiornamento impresa",
      presenti: 0,
      totale: 0,
      stato: statoDaRighe(cronologiaAggiornamenti),
    },
  ];
  const cardCciaaCompletate = cciaaCards.filter((c) => c.totale > 0 && c.presenti >= c.totale).length;
  const DatiCciaaIcon = CATEGORIA_ICONE["Dati CCIAA"];
  // § richiesta esplicita 05/09/2026: contatore della macro sezione, stessa
  // aggregazione mostrata dalle card sottostanti — sostituisce "N di N
  // sezioni completate" nell'intestazione. Il bollino verde richiede che
  // OGNI card sia sia compilata per intero (presenti >= totale) sia senza
  // nulla in sospeso (0 da verificare/da revisionare): una macro sezione
  // vuota non lo mostra mai, "niente da verificare" non è "tutto confermato".
  const statoDatiCciaa = sommaStati(...cciaaCards.map((c) => c.stato ?? { confermate: 0, daVerificare: 0, daRevisionare: 0 }));
  const tuttoConfermatoDatiCciaa = cciaaCards.every(
    (c) => c.presenti >= c.totale && (c.stato?.daVerificare ?? 0) === 0 && (c.stato?.daRevisionare ?? 0) === 0,
  );

  // --- Griglia delle macro sezioni Organizzazione/Trend/Assicurazioni/
  // Altre informazioni: stessa visualizzazione di "Dati CCIAA" sopra
  // (CciaaMacroSection + card con "N di N informazioni presenti" e la riga
  // a tre pallini confermato/da verificare/da revisionare), invece della
  // vecchia lista CollapsibleSection/SectionLinkCard senza alcun conteggio
  // (§ "falle tutte"). "Contratto di lavoro", "Posizioni assicurative e
  // previdenziali" e "Turni di lavoro" sono migrate al motore registro
  // campo-per-campo (vedi backend/app/core/registro_campi.py): le loro card
  // riusano `riepilogoSezioni` come le card CCIAA. Le altre 14 sezioni sono
  // "a elenco" (più record per azienda): la verifica è per riga
  // (`app.core.verifica_riga`, stesso motore di Soci/Amministratori/
  // Sindaci) — qui aggregata esattamente come `statoDaRighe` sopra, sempre
  // un oggetto (mai `null`, anche a tabella vuota: § richiesta esplicita di
  // coerenza con le sezioni a registro campo-per-campo, dove "tutto vuoto"
  // mostra comunque "0 confermate/0 da verificare/0 da revisionare" invece
  // di nascondere la riga dei pallini).
  const aggContrattoLavoro = sommaRegistro(["contratto-lavoro"]);
  const aggPosizioniAssicurative = sommaRegistro(["posizioni-assicurative-previdenziali"]);
  const aggTurniLavoro = sommaRegistro(["turni-lavoro"]);
  const SEZIONI_REGISTRO_ABBONAMENTO: Record<string, ReturnType<typeof sommaRegistro>> = {
    "contratto-lavoro": aggContrattoLavoro,
    "posizioni-assicurative-previdenziali": aggPosizioniAssicurative,
    "turni-lavoro": aggTurniLavoro,
  };

  const elencoIso9001Fetchers: Record<ElencoIso9001Key, () => Promise<ConVerificaRiga[]>> = {
    "fondi-interprofessionali": () => apiFetch<FondoInterprofessionale[]>("/api/anagrafica/fondi-interprofessionali"),
    "dati-generali": () => apiFetch<DatiGenerali[]>("/api/anagrafica/dati-generali"),
    outsourcing: () => apiFetch<Outsourcing[]>("/api/anagrafica/outsourcing"),
    subappaltatori: () => apiFetch<Subappaltatore[]>("/api/anagrafica/subappaltatori"),
    "fornitori-materiali": () => apiFetch<FornitoreMateriali[]>("/api/anagrafica/fornitori-materiali"),
    "lavoratori-autonomi": () => apiFetch<LavoratoreAutonomo[]>("/api/anagrafica/lavoratori-autonomi"),
    "ripartizione-organico": () => apiFetch<RipartizioneOrganico[]>("/api/anagrafica/ripartizione-organico"),
    "indicatori-economici": () => apiFetch<IndicatoreEconomico[]>("/api/anagrafica/indicatori-economici"),
    "variazioni-organico": () => apiFetch<VariazioneOrganico[]>("/api/anagrafica/variazioni-organico"),
    assicurazioni: () => apiFetch<Assicurazione[]>("/api/anagrafica/assicurazioni"),
    // § "presenza" (singleton booleano) non porta una verifica per riga
    // propria: solo l'elenco dei contratti la porta, presente/assente si
    // combina comunque nel calcolo di `presenti` sotto.
    "contratti-rete": () => apiFetch<ContrattoRete[]>("/api/anagrafica/contratti-rete"),
    "compliance-trasparenza": () => apiFetch<ComplianceTrasparenza[]>("/api/anagrafica/compliance-trasparenza"),
    "procedimenti-legali": () => apiFetch<ProcedimentoLegale[]>("/api/anagrafica/procedimenti-legali"),
    "visite-enti-controllo": () => apiFetch<VisitaEnteControllo[]>("/api/anagrafica/visite-enti-controllo"),
  };

  const categorieAltre = categorieVisibili(sezioniAbilitateSet).filter((c) => c.nome !== "Dati CCIAA");
  const sezioniAltrePerCategoria = new Map(
    categorieAltre.map((c) => [c.nome, sezioniPerCategoriaVisibili(c.nome, sezioniAbilitateSet)] as const),
  );
  const sezioniElencoDaVerificare = [...sezioniAltrePerCategoria.values()]
    .flat()
    .filter((s): s is (typeof SEZIONI_ANAGRAFICA)[number] & { slug: ElencoIso9001Key } =>
      isElencoIso9001Key(s.slug),
    );
  const [elencoAbbonamentoEntries, presenzaContrattiRete] = await Promise.all([
    Promise.all(sezioniElencoDaVerificare.map(async (s) => [s.slug, await elencoIso9001Fetchers[s.slug]()] as const)),
    sezioniElencoDaVerificare.some((s) => s.slug === "contratti-rete")
      ? apiFetch<ContrattiRetePresenza | null>("/api/anagrafica/contratti-rete/presenza")
      : Promise.resolve(null),
  ]);
  const elencoAbbonamento = new Map(elencoAbbonamentoEntries);

  const altreCategorieCards = categorieAltre.map((categoria) => {
    const sezioni = sezioniAltrePerCategoria.get(categoria.nome) ?? [];
    const cards = sezioni.map((sezione) => {
      const aggRegistro = SEZIONI_REGISTRO_ABBONAMENTO[sezione.slug];
      if (aggRegistro) {
        return {
          key: sezione.slug,
          titolo: sezione.titolo,
          presenti: aggRegistro.verified + aggRegistro.pending + aggRegistro.revisionRequired,
          totale: aggRegistro.totalApplicable,
          drawer: { sectionKey: sezione.slug, stato: statoDaRegistro(aggRegistro) },
        };
      }
      if (isElencoIso9001Key(sezione.slug)) {
        const righe = elencoAbbonamento.get(sezione.slug) ?? [];
        const presente =
          righe.length > 0 || (sezione.slug === "contratti-rete" && Boolean(presenzaContrattiRete?.presenza));
        return {
          key: sezione.slug,
          titolo: sezione.titolo,
          presenti: Number(presente),
          totale: 1,
          drawer: { sectionKey: sezione.slug, stato: statoDaRighe(righe) },
        };
      }
      return { key: sezione.slug, titolo: sezione.titolo, presenti: 0, totale: 1, drawer: null };
    });
    return {
      categoria,
      cards,
      completate: cards.filter((c) => c.totale > 0 && c.presenti >= c.totale).length,
      // Stesso principio di `statoDatiCciaa`/`tuttoConfermatoDatiCciaa` sopra.
      stato: sommaStati(...cards.map((c) => c.drawer?.stato ?? { confermate: 0, daVerificare: 0, daRevisionare: 0 })),
      tuttoConfermato: cards.every(
        (c) => c.presenti >= c.totale && (c.drawer?.stato.daVerificare ?? 0) === 0 && (c.drawer?.stato.daRevisionare ?? 0) === 0,
      ),
    };
  });

  // "Completamento scheda" (§8.2): stesso ambito esatto delle card
  // renderizzate sotto (Dati CCIAA + categorie ISO 9001 abilitate), non un
  // conteggio parallelo — così il numero coincide sempre con quello che
  // l'azienda/il consulente vede scorrendo la pagina.
  const sezioniPaginaTotali =
    cciaaCards.filter((c) => c.totale > 0).length + altreCategorieCards.reduce((s, { cards }) => s + cards.length, 0);
  const sezioniPaginaCompletate =
    cardCciaaCompletate + altreCategorieCards.reduce((s, { completate }) => s + completate, 0);

  let prossimaSezioneDaCompletare: ProssimaSezioneDaCompletare = null;
  const cciaaIncompleta = cciaaCards.find((c) => c.totale > 0 && c.presenti < c.totale);
  if (cciaaIncompleta) {
    prossimaSezioneDaCompletare = { tipo: "drawer", sectionKey: cciaaIncompleta.sectionKey };
  } else {
    for (const { cards } of altreCategorieCards) {
      const incompleta = cards.find((c) => c.totale > 0 && c.presenti < c.totale);
      if (!incompleta) continue;
      prossimaSezioneDaCompletare = incompleta.drawer
        ? { tipo: "drawer", sectionKey: incompleta.drawer.sectionKey }
        : { tipo: "link", href: `/anagrafica/${incompleta.key}` };
      break;
    }
  }

  const contenuto = (
    <div className="flex flex-col gap-6">
      <header className="flex min-h-[76px] items-center gap-7">
        <div className="grid size-[74px] shrink-0 place-items-center rounded-2xl border border-[var(--az-border)] bg-[rgba(255,255,255,0.84)] text-[var(--az-blue)] shadow-[var(--az-shadow)]">
          <Building2 className="size-9" />
        </div>
        <div>
          <h1 className="mb-1.5 text-[clamp(26px,2.1vw,34px)] font-extrabold tracking-tight text-[var(--az-ink)]">
            Anagrafica Aziendale
          </h1>
          <p className="text-[15px] leading-snug text-[var(--az-ink-soft)]">
            Informazioni generali e dati comunicati dall&apos;azienda
          </p>
        </div>
      </header>

      {/* @container: la griglia dei KPI deve reflowire in base alla propria
       * larghezza, non a quella della finestra — nell'affiancamento
       * home/dettaglio (§8.4) questo contenitore è largo solo ~50% della
       * pagina anche su schermi ampi. */}
      <div className="@container">
      <div className="grid grid-cols-1 gap-[22px] @2xl:grid-cols-2 @5xl:grid-cols-[1fr_1fr_1.06fr]">
        <CompletionCard
          completate={sezioniPaginaCompletate}
          totale={sezioniPaginaTotali}
          prossima={prossimaSezioneDaCompletare}
        />

        <QualityCard />

        <div className="@2xl:col-span-2 @5xl:col-span-1">
          <RecentChangesCard />
        </div>
      </div>
      </div>

      <div className="flex justify-end">
        <ExpandAllButton />
      </div>

      <CciaaMacroSection
        id="dati-cciaa"
        icon={<DatiCciaaIcon className="size-[22px]" />}
        title="Dati CCIAA"
        badge={<MacroStatoBadge stato={statoDatiCciaa} />}
        tuttoConfermato={tuttoConfermatoDatiCciaa}
        actions={<VisualizzaSintesiButton />}
      >
        {cciaaCards.map((card) => {
          const Icon = CCIAA_CARD_ICONE[card.key];
          return (
            <CciaaSectionCard
              key={card.key}
              icon={<Icon className="size-[18px]" />}
              title={card.titolo}
              presenti={card.presenti}
              totale={card.totale}
              stato={card.stato}
              sectionKey={card.sectionKey}
            />
          );
        })}
      </CciaaMacroSection>

      {altreCategorieCards.map(({ categoria, cards, stato, tuttoConfermato }) => {
        const CategoriaIcon = CATEGORIA_ICONE[categoria.nome];
        return (
          <CciaaMacroSection
            key={categoria.slug}
            id={categoriaSlug(categoria.nome)}
            icon={<CategoriaIcon className="size-[22px]" />}
            title={categoria.nome}
            badge={<MacroStatoBadge stato={stato} />}
            tuttoConfermato={tuttoConfermato}
          >
            {cards.map((card) => {
              const Icon = SEZIONE_ICONE[card.key];
              return card.drawer ? (
                <CciaaSectionCard
                  key={card.key}
                  icon={<Icon className="size-[18px]" />}
                  title={card.titolo}
                  presenti={card.presenti}
                  totale={card.totale}
                  stato={card.drawer.stato}
                  sectionKey={card.drawer.sectionKey}
                />
              ) : (
                <SectionPreviewGridCard
                  key={card.key}
                  icon={<Icon className="size-[18px]" />}
                  title={card.titolo}
                  presenti={card.presenti}
                  totale={card.totale}
                  href={`/anagrafica/${card.key}`}
                />
              );
            })}
          </CciaaMacroSection>
        );
      })}
    </div>
  );

  return (
    <WorkspaceProvider ruolo={ruolo} overviewIniziale={overview}>
      <WorkspaceShell>{contenuto}</WorkspaceShell>
    </WorkspaceProvider>
  );
}
