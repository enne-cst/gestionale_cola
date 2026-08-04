import { Building2 } from "lucide-react";

import { DataRow } from "@/components/data-row";
import { PageHeader } from "@/components/page-header";
import { SectionListPreviewCard } from "@/components/section-list-preview-card";
import { SectionPreviewCard } from "@/components/section-preview-card";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { SEZIONI_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  AttivitaEsercitata,
  CapitaleSociale,
  Contatto,
  DurataSocietaEsercizi,
  IdentificazioneCamerale,
  Sede,
} from "@/lib/types/anagrafica";

export default async function AnagraficaOverviewPage() {
  const [identificazione, durata, attivita, capitale, sedi, contatti] = await Promise.all([
    apiFetch<IdentificazioneCamerale | null>("/api/anagrafica/identificazione-camerale"),
    apiFetch<DurataSocietaEsercizi | null>("/api/anagrafica/durata-societa-esercizi"),
    apiFetch<AttivitaEsercitata | null>("/api/anagrafica/attivita-esercitata"),
    apiFetch<CapitaleSociale | null>("/api/anagrafica/capitale-sociale"),
    apiFetch<Sede[]>("/api/anagrafica/sedi"),
    apiFetch<Contatto[]>("/api/anagrafica/contatti"),
  ]);

  const stato = {
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
  };
  const sezioniCompilate = Object.values(stato).filter(Boolean).length;
  const percentuale = Math.round((sezioniCompilate / SEZIONI_ANAGRAFICA.length) * 100);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={Building2}
        title="Anagrafica Aziendale"
        subtitle="Informazioni generali e dati comunicati dall'azienda"
        size="lg"
      />

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Completezza della scheda</span>
          <span className="text-muted-foreground">
            {sezioniCompilate} di {SEZIONI_ANAGRAFICA.length} sezioni compilate
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentuale}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionPreviewCard
          icon={SEZIONE_ICONE["identificazione-camerale"]}
          title="Identificazione camerale"
          compilata={stato["identificazione-camerale"]}
          href="/anagrafica/identificazione-camerale"
        >
          {identificazione ? (
            <div className="grid grid-cols-2 gap-4">
              <DataRow label="Ragione sociale" value={identificazione.ragione_sociale} />
              <DataRow label="Forma giuridica" value={identificazione.forma_giuridica} />
              <DataRow label="Codice fiscale" value={identificazione.codice_fiscale} />
              <DataRow label="Partita IVA" value={identificazione.partita_iva} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessun dato inserito ancora.</p>
          )}
        </SectionPreviewCard>

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
      </div>
    </div>
  );
}
