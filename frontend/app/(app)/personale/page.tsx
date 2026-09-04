import { Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import type {
  CatalogoVoce,
  DocumentoPersonale,
  Page as ApiPage,
  PersonaListRow,
  PersonaProfilo,
  PersonaRuolo,
} from "@/lib/types/personale-hr";
import type { RuoloSummary } from "@/lib/types/personale";

import { PersonaleShell } from "./personale-shell";

// Fase 1 — Fondazioni (SPECIFICA_IMPLEMENTAZIONE_MODULO_PERSONALE §8.1,
// §9-§12): la vista Persone, la shell della scheda persona e il tab
// Persona e rapporto sono funzionanti. Monitoraggio/Scadenziario/Analisi
// e i tab Ruoli/Formazione/Idoneità/Competenze/Note restano segnaposto —
// richiedono endpoint dedicati non ancora costruiti (Fasi 2-5).

type SearchParams = Record<string, string | string[] | undefined>;

function primo(valore: string | string[] | undefined): string | undefined {
  return Array.isArray(valore) ? valore[0] : valore;
}

export default async function PersonalePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const view = primo(params.view) ?? "people";
  const personId = primo(params.personId);
  const tab = primo(params.tab) ?? "overview";
  const layout = primo(params.layout) ?? "split";
  const q = primo(params.q) ?? "";
  const repartoId = primo(params.reparto_id) ?? "";
  const mansioneId = primo(params.mansione_id) ?? "";
  const statoRapporto = primo(params.stato_rapporto) ?? "";
  const page = Number(primo(params.page) ?? "1") || 1;

  const listQuery = new URLSearchParams({ page: String(page), page_size: "20" });
  if (q) listQuery.set("q", q);
  if (repartoId) listQuery.set("reparto_id", repartoId);
  if (mansioneId) listQuery.set("mansione_id", mansioneId);
  if (statoRapporto) listQuery.set("stato_rapporto", statoRapporto);

  const ruoloId = primo(params.ruolo_id) ?? "";
  if (ruoloId) listQuery.set("ruolo_id", ruoloId);

  const [persone, mansioni, reparti, tipiRapporto, ruoli, tipiDocumento, profiloSelezionato, ruoliPersona, documentiPersona] =
    await Promise.all([
      apiFetch<ApiPage<PersonaListRow>>(`/api/personale/schede-persona?${listQuery.toString()}`),
      apiFetch<CatalogoVoce[]>("/api/personale/mansioni"),
      apiFetch<CatalogoVoce[]>("/api/personale/reparti"),
      apiFetch<CatalogoVoce[]>("/api/personale/tipi-rapporto"),
      apiFetch<RuoloSummary[]>("/api/personale/ruoli"),
      apiFetch<CatalogoVoce[]>("/api/personale/tipi-documento-identita"),
      personId ? apiFetch<PersonaProfilo>(`/api/personale/persone/${personId}/profilo`) : Promise.resolve(null),
      personId ? apiFetch<PersonaRuolo[]>(`/api/personale/persone/${personId}/ruoli`) : Promise.resolve([]),
      personId ? apiFetch<DocumentoPersonale[]>(`/api/personale/persone/${personId}/documenti`) : Promise.resolve([]),
    ]);

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <PageHeader icon={Users} title="Personale" subtitle="Anagrafica, ruoli, formazione e idoneità del personale." />
      <PersonaleShell
        view={view}
        tab={tab}
        layout={layout}
        filtri={{ q, repartoId, mansioneId, statoRapporto, ruoloId, page }}
        persone={persone}
        mansioni={mansioni}
        reparti={reparti}
        tipiRapporto={tipiRapporto}
        ruoli={ruoli}
        tipiDocumento={tipiDocumento}
        personaSelezionata={profiloSelezionato}
        ruoliPersona={ruoliPersona}
        documentiPersona={documentiPersona}
      />
    </div>
  );
}
