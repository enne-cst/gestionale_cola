import { ArrowRightIcon, Building2, CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CollapsibleSection } from "@/components/collapsible-section";
import { CompletenessRing } from "@/components/completeness-ring";
import { DataRow } from "@/components/data-row";
import { ExpandAllButton } from "@/components/expand-all-button";
import { IconAvatar } from "@/components/icon-avatar";
import { CompanyCard } from "@/components/registro/company-card";
import { CorporateSection } from "@/components/registro/corporate-section";
import { InformazioniSocietarieCard } from "@/components/registro/informazioni-societarie-card";
import { QualityCard } from "@/components/registro/quality-card";
import { RecentChangesCard } from "@/components/registro/recent-changes-card";
import { WorkspaceProvider } from "@/components/registro/workspace-provider";
import { WorkspaceShell } from "@/components/registro/workspace-shell";
import { SectionListPreviewCard } from "@/components/section-list-preview-card";
import { SectionPreviewCard } from "@/components/section-preview-card";
import { SectionLinkCard } from "@/components/section-link-card";
import { apiFetch } from "@/lib/api";
import { getRegistroOverview } from "@/lib/actions/registro";
import { CATEGORIA_ICONE, SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import {
  categoriaSlug,
  categorieVisibili,
  SEZIONI_ANAGRAFICA,
  sezioniPerCategoriaVisibili,
} from "@/lib/anagrafica-sezioni";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MeResponse } from "@/lib/types/auth";
import type {
  AddettiComune,
  AddettiVisura,
  AlboRuoloLicenza,
  AmministrazioneControllo,
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
    amministrazioneControllo,
    albi,
    soa,
    certificazioni,
    addettiVisura,
    addettiComune,
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
    apiFetch<AmministrazioneControllo | null>("/api/anagrafica/amministrazione-controllo"),
    apiFetch<AlboRuoloLicenza[]>("/api/anagrafica/albi-ruoli-licenze"),
    apiFetch<Soa[]>("/api/anagrafica/soa"),
    apiFetch<Certificazione[]>("/api/anagrafica/certificazioni"),
    apiFetch<AddettiVisura[]>("/api/anagrafica/addetti-visura"),
    apiFetch<AddettiComune[]>("/api/anagrafica/addetti-comune"),
  ]);

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
    "amministrazione-controllo": Boolean(amministrazioneControllo?.organo_amministrativo_in_carica),
    "albi-ruoli-licenze": albi.length > 0,
    soa: soa.length > 0,
    certificazioni: certificazioni.length > 0,
    "addetti-visura": addettiVisura.length > 0,
    "addetti-comune": addettiComune.length > 0,
  };
  // La completezza traccia solo le sezioni base (sempre visibili): le
  // sezioni ISO 9001 non hanno qui i dati caricati (vedi SectionLinkCard
  // sotto, che non li richiede), quindi non possono contribuire a questo
  // calcolo senza una fetch dedicata per ciascuna.
  const sezioniBase = SEZIONI_ANAGRAFICA.filter((s) => s.codice === undefined);
  const sezioniCompilate = Object.values(stato).filter(Boolean).length;
  const percentuale = Math.round((sezioniCompilate / sezioniBase.length) * 100);
  const sezioniDaCompletare = sezioniBase.filter((s) => !stato[s.slug]);
  const sezioniAbilitateSet = new Set(sezioniAbilitate);
  const IdentificazioneCameraleIcon = SEZIONE_ICONE["identificazione-camerale"];

  // "Informazioni societarie" (Identificazione camerale, Durata società ed
  // esercizi, Attività esercitata, Capitale sociale) ha un trattamento
  // grafico dedicato (vedi <CorporateSection> più sotto, calcato sul
  // prototipo di riferimento): non passa da `cardBySlug`/`CollapsibleSection`
  // come le altre categorie.
  const cardBySlug: Record<string, ReactNode> = {
    "iscrizioni-registro-imprese": (
      <SectionListPreviewCard
        icon={SEZIONE_ICONE["iscrizioni-registro-imprese"]}
        title="Iscrizioni registro imprese"
        href="/anagrafica/iscrizioni-registro-imprese"
        items={iscrizioni}
        emptyLabel="Nessuna iscrizione registrata."
        renderItem={(iscrizione) => (
          <span className="flex flex-col">
            <span className="font-medium text-foreground">{iscrizione.tipo_iscrizione ?? "Iscrizione"}</span>
            <span className="text-xs text-muted-foreground">{iscrizione.sezione ?? "—"}</span>
          </span>
        )}
      />
    ),
    "codici-ateco": (
      <SectionListPreviewCard
        icon={SEZIONE_ICONE["codici-ateco"]}
        title="Codici ATECO"
        href="/anagrafica/codici-ateco"
        items={codiciAteco}
        emptyLabel="Nessun codice ATECO registrato."
        renderItem={(codice) => (
          <span className="flex flex-col">
            <span className="font-medium text-foreground">{codice.codice}</span>
            <span className="text-xs text-muted-foreground">{codice.descrizione ?? codice.ruolo_codice ?? "—"}</span>
          </span>
        )}
      />
    ),
    "amministrazione-controllo": (
      <SectionPreviewCard
        icon={SEZIONE_ICONE["amministrazione-controllo"]}
        title="Amministrazione e controllo"
        compilata={stato["amministrazione-controllo"]}
        href="/anagrafica/amministrazione-controllo"
      >
        {amministrazioneControllo ? (
          <div className="grid grid-cols-2 gap-4">
            <DataRow label="Organo in carica" value={amministrazioneControllo.organo_amministrativo_in_carica} />
            <DataRow
              label="Amministratori in carica"
              value={amministrazioneControllo.numero_amministratori_in_carica?.toString() ?? null}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nessun dato inserito ancora.</p>
        )}
      </SectionPreviewCard>
    ),
    "albi-ruoli-licenze": (
      <SectionListPreviewCard
        icon={SEZIONE_ICONE["albi-ruoli-licenze"]}
        title="Albi, ruoli e licenze"
        href="/anagrafica/albi-ruoli-licenze"
        items={albi}
        emptyLabel="Nessuna iscrizione registrata."
        renderItem={(albo) => (
          <span className="flex flex-col">
            <span className="font-medium text-foreground">{albo.tipologia}</span>
            <span className="text-xs text-muted-foreground">{albo.stato ?? "—"}</span>
          </span>
        )}
      />
    ),
    soa: (
      <SectionListPreviewCard
        icon={SEZIONE_ICONE.soa}
        title="Attestazioni SOA"
        href="/anagrafica/soa"
        items={soa}
        emptyLabel="Nessuna attestazione SOA registrata."
        renderItem={(attestazione) => (
          <span className="flex flex-col">
            <span className="font-medium text-foreground">{attestazione.numero_attestazione ?? "Attestazione"}</span>
            <span className="text-xs text-muted-foreground">
              {attestazione.categorie.map((c) => c.categoria).join(", ") || "—"}
            </span>
          </span>
        )}
      />
    ),
    certificazioni: (
      <SectionListPreviewCard
        icon={SEZIONE_ICONE.certificazioni}
        title="Certificazioni possedute"
        href="/anagrafica/certificazioni"
        items={certificazioni}
        emptyLabel="Nessuna certificazione registrata."
        renderItem={(cert) => (
          <span className="flex flex-col">
            <span className="font-medium text-foreground">{cert.tipologia_certificazione ?? cert.sigla ?? "Certificazione"}</span>
            <span className="text-xs text-muted-foreground">{cert.norma_riferimento ?? "—"}</span>
          </span>
        )}
      />
    ),
    "addetti-visura": (
      <SectionListPreviewCard
        icon={SEZIONE_ICONE["addetti-visura"]}
        title="Addetti da visura"
        href="/anagrafica/addetti-visura"
        items={addettiVisura}
        emptyLabel="Nessuna rilevazione registrata."
        renderItem={(rilevazione) => (
          <span className="flex flex-col">
            <span className="font-medium text-foreground">{rilevazione.anno_riferimento ?? "Rilevazione"}</span>
            <span className="text-xs text-muted-foreground">{rilevazione.fonte ?? "—"}</span>
          </span>
        )}
      />
    ),
    "addetti-comune": (
      <SectionListPreviewCard
        icon={SEZIONE_ICONE["addetti-comune"]}
        title="Addetti per comune"
        href="/anagrafica/addetti-comune"
        items={addettiComune}
        emptyLabel="Nessuna distribuzione registrata."
        renderItem={(distribuzione) => (
          <span className="flex flex-col">
            <span className="font-medium text-foreground">{distribuzione.comune}</span>
            <span className="text-xs text-muted-foreground">{distribuzione.provincia ?? "—"}</span>
          </span>
        )}
      />
    ),
    sedi: (
      <SectionListPreviewCard
        icon={SEZIONE_ICONE.sedi}
        title="Sedi"
        href="/anagrafica/sedi"
        items={sedi}
        emptyLabel="Nessuna sede registrata."
        renderItem={(sede) => (
          <span className="flex flex-col">
            <span className="font-medium text-foreground">{sede.denominazione_sede ?? sede.tipo_sede}</span>
            <span className="text-xs text-muted-foreground">
              {[sede.indirizzo, sede.comune].filter(Boolean).join(", ") || sede.tipo_sede}
            </span>
          </span>
        )}
      />
    ),
    contatti: (
      <SectionListPreviewCard
        icon={SEZIONE_ICONE.contatti}
        title="Contatti e recapiti"
        href="/anagrafica/contatti"
        items={contatti}
        emptyLabel="Nessun contatto registrato."
        renderItem={(contatto) => (
          <span className="flex flex-col">
            <span className="font-medium text-foreground">{contatto.valore}</span>
            <span className="text-xs text-muted-foreground">{contatto.tipo_contatto}</span>
          </span>
        )}
      />
    ),
  };

  const durataDettagli = durata
    ? ([
        ["Data termine società", formatDate(durata.data_termine_societa)],
        ["Scadenza primo esercizio", formatDate(durata.scadenza_primo_esercizio)],
      ] satisfies [string, ReactNode][])
    : null;
  const attivitaDettagli = attivita?.descrizione_attivita_esercitata
    ? ([["Descrizione", attivita.descrizione_attivita_esercitata]] satisfies [string, ReactNode][])
    : null;
  const capitaleDettagli = capitale
    ? ([
        ["Capitale deliberato", formatCurrency(capitale.capitale_deliberato, capitale.valuta ?? "EUR")],
        ["Capitale sottoscritto", formatCurrency(capitale.capitale_sottoscritto, capitale.valuta ?? "EUR")],
        ["Capitale versato", formatCurrency(capitale.capitale_versato, capitale.valuta ?? "EUR")],
        ["Valuta", capitale.valuta],
      ] satisfies [string, ReactNode][])
    : null;

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

      <CorporateSection icon={<IdentificazioneCameraleIcon className="size-[22px]" />} title="Informazioni societarie">
        <InformazioniSocietarieCard identificazione={identificazione} />
        <CompanyCard
          icon={SEZIONE_ICONE["durata-societa-esercizi"]}
          title="Durata società ed esercizi"
          stato={stato["durata-societa-esercizi"] ? "completato" : "incompleto"}
          details={durataDettagli}
          actionLabel={stato["durata-societa-esercizi"] ? "Visualizza dettagli" : "Compila sezione"}
          href="/anagrafica/durata-societa-esercizi"
        />
        <CompanyCard
          icon={SEZIONE_ICONE["attivita-esercitata"]}
          title="Attività esercitata"
          stato={stato["attivita-esercitata"] ? "completato" : "incompleto"}
          details={attivitaDettagli}
          actionLabel={stato["attivita-esercitata"] ? "Visualizza dettagli" : "Compila sezione"}
          href="/anagrafica/attivita-esercitata"
        />
        <CompanyCard
          icon={SEZIONE_ICONE["capitale-sociale"]}
          title="Capitale sociale"
          stato={stato["capitale-sociale"] ? "completato" : "incompleto"}
          details={capitaleDettagli}
          actionLabel={stato["capitale-sociale"] ? "Visualizza dettagli" : "Compila sezione"}
          href="/anagrafica/capitale-sociale"
        />
      </CorporateSection>

      {categorieVisibili(sezioniAbilitateSet)
        .filter((categoria) => categoria.nome !== "Informazioni societarie")
        .map((categoria) => {
          const sezioni = sezioniPerCategoriaVisibili(categoria.nome, sezioniAbilitateSet);
          // Le sezioni ISO 9001 non hanno un dato "compilata/da compilare"
          // qui (vedi nota sopra): il sottotitolo mostra il conteggio solo
          // se almeno una sezione della categoria è effettivamente tracciata.
          const sezioniTracciate = sezioni.filter((s) => s.slug in stato);
          const subtitle =
            sezioniTracciate.length > 0
              ? `${sezioni.filter((s) => stato[s.slug]).length} di ${sezioni.length} sezioni compilate`
              : `${sezioni.length} sezioni`;

          return (
            <CollapsibleSection
              key={categoria.slug}
              id={categoriaSlug(categoria.nome)}
              icon={<IconAvatar icon={CATEGORIA_ICONE[categoria.nome]} size="sm" />}
              title={categoria.nome}
              subtitle={subtitle}
            >
              {sezioni.map((sezione) => (
                <div key={sezione.slug}>
                  {cardBySlug[sezione.slug] ?? (
                    <SectionLinkCard
                      icon={SEZIONE_ICONE[sezione.slug]}
                      title={sezione.titolo}
                      subtitle="Vai alla sezione"
                      href={`/anagrafica/${sezione.slug}`}
                    />
                  )}
                </div>
              ))}
            </CollapsibleSection>
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
