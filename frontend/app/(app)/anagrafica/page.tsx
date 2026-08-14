import { ArrowRightIcon, Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CollapsibleSection } from "@/components/collapsible-section";
import { CompletenessRing } from "@/components/completeness-ring";
import { DataRow } from "@/components/data-row";
import { ExpandAllButton } from "@/components/expand-all-button";
import { IconAvatar } from "@/components/icon-avatar";
import { PageHeader } from "@/components/page-header";
import { InformazioniSocietarieCard } from "@/components/registro/informazioni-societarie-card";
import { QualityCard } from "@/components/registro/quality-card";
import { RecentChangesCard } from "@/components/registro/recent-changes-card";
import { WorkspaceProvider } from "@/components/registro/workspace-provider";
import { WorkspaceShell } from "@/components/registro/workspace-shell";
import { SectionListPreviewCard } from "@/components/section-list-preview-card";
import { SectionPreviewCard } from "@/components/section-preview-card";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

  const cardBySlug: Record<string, ReactNode> = {
    "identificazione-camerale": <InformazioniSocietarieCard identificazione={identificazione} />,
    "capitale-sociale": (
      <SectionPreviewCard
        icon={SEZIONE_ICONE["capitale-sociale"]}
        title="Capitale sociale"
        compilata={stato["capitale-sociale"]}
        href="/anagrafica/capitale-sociale"
      >
        {capitale ? (
          <div className="grid grid-cols-2 gap-4">
            <DataRow label="Capitale deliberato" value={formatCurrency(capitale.capitale_deliberato, capitale.valuta ?? "EUR")} />
            <DataRow label="Capitale sottoscritto" value={formatCurrency(capitale.capitale_sottoscritto, capitale.valuta ?? "EUR")} />
            <DataRow label="Capitale versato" value={formatCurrency(capitale.capitale_versato, capitale.valuta ?? "EUR")} />
            <DataRow label="Valuta" value={capitale.valuta} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nessun dato inserito ancora.</p>
        )}
      </SectionPreviewCard>
    ),
    "attivita-esercitata": (
      <SectionPreviewCard
        icon={SEZIONE_ICONE["attivita-esercitata"]}
        title="Attività esercitata"
        compilata={stato["attivita-esercitata"]}
        href="/anagrafica/attivita-esercitata"
      >
        {attivita?.descrizione_attivita_esercitata ? (
          <p className="line-clamp-3 text-sm text-foreground">{attivita.descrizione_attivita_esercitata}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Nessun dato inserito ancora.</p>
        )}
      </SectionPreviewCard>
    ),
    "durata-societa-esercizi": (
      <SectionPreviewCard
        icon={SEZIONE_ICONE["durata-societa-esercizi"]}
        title="Durata società ed esercizi"
        compilata={stato["durata-societa-esercizi"]}
        href="/anagrafica/durata-societa-esercizi"
      >
        {durata ? (
          <div className="grid grid-cols-2 gap-4">
            <DataRow label="Data termine società" value={formatDate(durata.data_termine_societa)} />
            <DataRow label="Scadenza primo esercizio" value={formatDate(durata.scadenza_primo_esercizio)} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nessun dato inserito ancora.</p>
        )}
      </SectionPreviewCard>
    ),
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

  const contenuto = (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={Building2}
        title="Anagrafica Aziendale"
        subtitle="Informazioni generali e dati comunicati dall'azienda"
        size="lg"
      />

      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
          <Card className="gap-4 overflow-hidden py-0 pt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="size-4" />
                Completamento scheda
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <CompletenessRing percentuale={percentuale} />
              <p className="text-sm text-muted-foreground">
                {sezioniCompilate} di {sezioniBase.length} sezioni compilate
              </p>
            </CardContent>
            {sezioniDaCompletare[0] && (
              <CardFooter className="mt-2 border-t border-primary/15 bg-primary/5 py-3">
                <Link
                  href={`/anagrafica/${sezioniDaCompletare[0].slug}`}
                  className="flex w-full items-center justify-between text-sm font-medium text-primary hover:underline"
                >
                  Completa la prossima sezione
                  <ArrowRightIcon className="size-4 shrink-0" />
                </Link>
              </CardFooter>
            )}
          </Card>

          {ruolo === "CONSULENTE" && <QualityCard />}

          <div className="@lg:col-span-2 @4xl:col-span-1">
            <RecentChangesCard />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <ExpandAllButton />
      </div>

      {categorieVisibili(sezioniAbilitateSet).map((categoria) => {
        const sezioni = sezioniPerCategoriaVisibili(categoria.nome, sezioniAbilitateSet);
        // Le sezioni ISO 9001 non hanno un dato "compilata/da compilare"
        // qui (vedi nota sopra): il sottotitolo mostra il conteggio solo se
        // almeno una sezione della categoria è effettivamente tracciata.
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
