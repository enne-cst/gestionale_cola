import { ArrowRightIcon, Building2, CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

import { CompletenessRing } from "@/components/completeness-ring";
import { ExpandAllButton } from "@/components/expand-all-button";
import { CciaaMacroSection } from "@/components/registro/cciaa-macro-section";
import { CciaaSectionCard, type CciaaSectionCardStato } from "@/components/registro/cciaa-section-card";
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
  AlboRuoloLicenza,
  AttivitaEsercitata,
  CapitaleSociale,
  Certificazione,
  CodiceAteco,
  Contatto,
  DurataSocietaEsercizi,
  IdentificazioneCamerale,
  IscrizioneRegistroImprese,
  Sede,
  Soa,
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
    identificazione,
    durata,
    attivita,
    capitale,
    sedi,
    contatti,
    iscrizioni,
    codiciAteco,
    albi,
    soa,
    certificazioni,
    addettiVisura,
    addettiComune,
    riepilogoSezioni,
    incarichi,
  ] = await Promise.all([
    apiFetch<string[]>("/api/sezioni"),
    apiFetch<IdentificazioneCamerale | null>("/api/anagrafica/identificazione-camerale"),
    apiFetch<DurataSocietaEsercizi | null>("/api/anagrafica/durata-societa-esercizi"),
    apiFetch<AttivitaEsercitata | null>("/api/anagrafica/attivita-esercitata"),
    apiFetch<CapitaleSociale | null>("/api/anagrafica/capitale-sociale"),
    apiFetch<Sede[]>("/api/anagrafica/sedi"),
    apiFetch<Contatto[]>("/api/anagrafica/contatti"),
    apiFetch<IscrizioneRegistroImprese[]>("/api/anagrafica/iscrizioni-registro-imprese"),
    apiFetch<CodiceAteco[]>("/api/anagrafica/codici-ateco"),
    apiFetch<AlboRuoloLicenza[]>("/api/anagrafica/albi-ruoli-licenze"),
    apiFetch<Soa[]>("/api/anagrafica/soa"),
    apiFetch<Certificazione[]>("/api/anagrafica/certificazioni"),
    apiFetch<AddettiVisura[]>("/api/anagrafica/addetti-visura"),
    apiFetch<AddettiComune[]>("/api/anagrafica/addetti-comune"),
    getRiepilogoSezioni(),
    getIncarichi(),
  ]);

  // Costruita qui (non più sotto, § commento originale) perché serve già
  // per calcolare la completezza di "amministrazione-controllo": quel
  // campo vive solo nel registro campo-per-campo (Correzione 04), non più
  // in una fetch dedicata.
  const riepilogoPerSezione = new Map(riepilogoSezioni.map((r) => [r.sectionKey, r]));
  const riepilogoAmministrazioneControllo = riepilogoPerSezione.get("amministrazione-controllo");

  const stato: Record<string, boolean> = {
    "identificazione-camerale": Boolean(identificazione?.ragione_sociale),
    "durata-societa-esercizi": Boolean(
      durata?.data_termine_societa || durata?.scadenza_primo_esercizio || durata?.scadenza_esercizi_successivi,
    ),
    "attivita-esercitata": Boolean(attivita?.descrizione_attivita_esercitata),
    "capitale-sociale": Boolean(
      capitale?.capitale_deliberato || capitale?.capitale_sottoscritto || capitale?.capitale_versato,
    ),
    sedi: sedi.length > 0,
    contatti: contatti.length > 0,
    "iscrizioni-registro-imprese": iscrizioni.length > 0,
    "codici-ateco": codiciAteco.length > 0,
    "amministrazione-controllo": Boolean(
      riepilogoAmministrazioneControllo &&
        riepilogoAmministrazioneControllo.verified +
          riepilogoAmministrazioneControllo.pending +
          riepilogoAmministrazioneControllo.revisionRequired >
          0,
    ),
    "albi-ruoli-licenze": albi.length > 0,
    soa: soa.length > 0,
    certificazioni: certificazioni.length > 0,
    "addetti-visura": addettiVisura.length > 0,
    "addetti-comune": addettiComune.length > 0,
  };
  // La completezza del riquadro "Completamento scheda" traccia solo le
  // sezioni base (sempre visibili, § comune a tutte le aziende): le sezioni
  // ISO 9001 hanno il proprio conteggio "N di N sezioni completate" per
  // macro sezione più sotto (`altreCategorieCards`), calcolato a parte.
  const sezioniBase = SEZIONI_ANAGRAFICA.filter((s) => s.codice === undefined);
  const sezioniCompilate = Object.values(stato).filter(Boolean).length;
  const percentuale = Math.round((sezioniCompilate / sezioniBase.length) * 100);
  const sezioniDaCompletare = sezioniBase.filter((s) => !stato[s.slug]);
  const sezioniAbilitateSet = new Set(sezioniAbilitate);

  // --- Conteggi delle 10 card "Dati CCIAA" (§6.3/§6.4 del protocollo) ---
  // Solo le sezioni realmente a registro (identificazione-camerale,
  // capitale-sociale, durata-societa-esercizi, amministrazione-controllo)
  // hanno uno stato di verifica per campo: le altre card mostrano presenza
  // reale ("N di N informazioni presenti"), mai pallini inventati (§18).
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
  // Soci/Amministratori/Sindaci non hanno un registro campo-per-campo, ma
  // ogni incarico porta comunque una verifica reale del consulente sulla
  // riga (vedi `app/core/incarichi.py`, non più la caratteristica A32 nel
  // form): i pallini qui sotto aggregano quel dato esistente, non ne
  // inventano uno nuovo (§18). Restituisce sempre l'oggetto (mai `null`,
  // anche a tabella vuota): stessa convenzione delle sezioni a registro
  // campo-per-campo, dove una sezione mai compilata mostra comunque "0
  // confermate/0 da verificare/0 da revisionare" invece di nascondere la
  // riga dei pallini — coerenza tra i due meccanismi di verifica, § richiesta
  // esplicita.
  function statoDaIncarichi(righe: typeof incarichi): CciaaSectionCardStato {
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

  const righeSoci = incarichi.filter((i) => i.ruolo.codice === "SOCIO");
  const righeAmministratori = incarichi.filter((i) => RUOLI_AMMINISTRATORI.has(i.ruolo.codice));
  const righeSindaci = incarichi.filter((i) => RUOLI_SINDACI.has(i.ruolo.codice));

  const aggStatuto = sommaRegistro(["statuto"]);
  const aggCapitale = sommaRegistro(["capitale-sociale"]);
  const aggSede = sommaRegistro(["sede"]);
  const aggUnitaLocali = sommaRegistro(["unita-locali"]);

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
      stato: statoDaIncarichi(righeSoci),
    },
    {
      key: "amministratori",
      sectionKey: "amministratori",
      titolo: "Amministratori",
      presenti: Number(righeAmministratori.length > 0),
      totale: 1,
      stato: statoDaIncarichi(righeAmministratori),
    },
    {
      key: "sindaci",
      sectionKey: "sindaci",
      titolo: "Sindaci e membri degli organi di controllo",
      presenti: Number(righeSindaci.length > 0),
      totale: 1,
      stato: statoDaIncarichi(righeSindaci),
    },
    {
      key: "attivita-albi",
      sectionKey: "attivita-albi",
      titolo: "Attività, albi, ruoli e licenze",
      presenti:
        Number(stato["attivita-esercitata"]) +
        Number(stato["codici-ateco"]) +
        Number(stato["albi-ruoli-licenze"]) +
        Number(stato.soa) +
        Number(stato.certificazioni),
      totale: 5,
      stato: null,
    },
    {
      key: "personale-occupazione",
      sectionKey: "personale-occupazione",
      titolo: "Personale e occupazione",
      presenti: Number(stato["addetti-visura"]) + Number(stato["addetti-comune"]),
      totale: 2,
      stato: null,
    },
    {
      key: "sedi-secondarie",
      sectionKey: "sedi-secondarie",
      titolo: "Sedi secondarie e unità locali",
      presenti: aggUnitaLocali.verified + aggUnitaLocali.pending + aggUnitaLocali.revisionRequired,
      totale: aggUnitaLocali.totalApplicable,
      stato: statoDaRegistro(aggUnitaLocali),
    },
    {
      // § Correzione 24: card ricostruita come cronologia automatica, 4
      // indicatori derivati e nessun campo compilabile — il conteggio
      // "informazioni presenti" di questa griglia non si applica più
      // (totale 0, mai nel denominatore di `cardCciaaCompletate`).
      key: "aggiornamento-impresa",
      sectionKey: "aggiornamento-impresa",
      titolo: "Aggiornamento impresa",
      presenti: 0,
      totale: 0,
      stato: null,
    },
  ];
  const cardCciaaCompletate = cciaaCards.filter((c) => c.totale > 0 && c.presenti >= c.totale).length;
  const DatiCciaaIcon = CATEGORIA_ICONE["Dati CCIAA"];

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
  // Sindaci) — qui aggregata esattamente come `statoDaIncarichi` sopra,
  // sempre un oggetto (mai `null`, anche a tabella vuota: § richiesta
  // esplicita di coerenza con le sezioni a registro campo-per-campo, dove
  // "tutto vuoto" mostra comunque "0 confermate/0 da verificare/0 da
  // revisionare" invece di nascondere la riga dei pallini).
  const aggContrattoLavoro = sommaRegistro(["contratto-lavoro"]);
  const aggPosizioniAssicurative = sommaRegistro(["posizioni-assicurative-previdenziali"]);
  const aggTurniLavoro = sommaRegistro(["turni-lavoro"]);
  const SEZIONI_REGISTRO_ABBONAMENTO: Record<string, ReturnType<typeof sommaRegistro>> = {
    "contratto-lavoro": aggContrattoLavoro,
    "posizioni-assicurative-previdenziali": aggPosizioniAssicurative,
    "turni-lavoro": aggTurniLavoro,
  };

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
    return { categoria, cards, completate: cards.filter((c) => c.totale > 0 && c.presenti >= c.totale).length };
  });

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
        <article className="az-dashboard-card relative flex min-h-[276px] flex-col overflow-hidden pb-[50px]">
          <div className="flex min-h-14 items-center gap-2.5 px-[26px] pt-[18px] pb-2.5">
            <CheckCircle2Icon className="size-4 text-[var(--az-muted)]" />
            <h2 className="text-base font-extrabold tracking-tight text-[var(--az-ink)]">Completamento scheda</h2>
          </div>
          <div className="flex items-center gap-[34px] px-[30px] py-[10px]">
            <CompletenessRing percentuale={percentuale} />
            <div className="flex flex-col gap-1.5">
              <strong className="text-[22px] leading-none text-[var(--az-ink)]">
                {sezioniCompilate} di {sezioniBase.length}
              </strong>
              <span className="text-sm text-[var(--az-muted)]">sezioni completate</span>
            </div>
          </div>
          {sezioniDaCompletare[0] && (
            <Link
              href={`/anagrafica/${sezioniDaCompletare[0].slug}`}
              className="absolute inset-x-0 bottom-0 flex min-h-[50px] items-center gap-3.5 border-t border-[var(--az-border)] bg-[#fbfdfff5] px-[26px] text-sm font-bold text-[var(--az-blue)] transition-colors hover:bg-[#f3f7ff] hover:text-[var(--az-blue-dark)]"
            >
              <span className="mr-auto">Completa la prossima sezione</span>
              <ArrowRightIcon className="size-[18px] shrink-0" />
            </Link>
          )}
        </article>

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
        badge={`${cardCciaaCompletate} di ${cciaaCards.length} sezioni completate`}
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

      {altreCategorieCards.map(({ categoria, cards, completate }) => {
        const CategoriaIcon = CATEGORIA_ICONE[categoria.nome];
        return (
          <CciaaMacroSection
            key={categoria.slug}
            id={categoriaSlug(categoria.nome)}
            icon={<CategoriaIcon className="size-[22px]" />}
            title={categoria.nome}
            badge={`${completate} di ${cards.length} sezioni completate`}
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
