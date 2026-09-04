"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type {
  CatalogoVoce,
  DocumentoPersonale,
  Page as ApiPage,
  PersonaListRow,
  PersonaProfilo,
  PersonaRuolo,
} from "@/lib/types/personale-hr";
import type { RuoloSummary } from "@/lib/types/personale";

import { PeopleList } from "./people-list";
import { PersonDetail } from "./person-detail";

const VISTE_PRINCIPALI = [
  { value: "people", label: "Persone" },
  { value: "control", label: "Monitoraggio personale" },
  { value: "schedule", label: "Scadenziario" },
  { value: "analytics", label: "Analisi formazione" },
] as const;

export function PersonaleShell({
  view,
  tab,
  layout,
  filtri,
  persone,
  mansioni,
  reparti,
  tipiRapporto,
  ruoli,
  tipiDocumento,
  personaSelezionata,
  ruoliPersona,
  documentiPersona,
}: {
  view: string;
  tab: string;
  layout: string;
  filtri: { q: string; repartoId: string; mansioneId: string; statoRapporto: string; ruoloId: string; page: number };
  persone: ApiPage<PersonaListRow>;
  mansioni: CatalogoVoce[];
  reparti: CatalogoVoce[];
  tipiRapporto: CatalogoVoce[];
  ruoli: RuoloSummary[];
  tipiDocumento: CatalogoVoce[];
  personaSelezionata: PersonaProfilo | null;
  ruoliPersona: PersonaRuolo[];
  documentiPersona: DocumentoPersonale[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefVista(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("view", value);
    next.delete("personId");
    next.delete("tab");
    return `${pathname}?${next.toString()}`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div role="tablist" className="flex gap-1 border-b border-border">
        {VISTE_PRINCIPALI.map((v) => (
          <Link
            key={v.value}
            href={hrefVista(v.value)}
            role="tab"
            aria-selected={view === v.value}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              view === v.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {view === "people" && !personaSelezionata && (
        <PeopleList
          persone={persone}
          mansioni={mansioni}
          reparti={reparti}
          tipiRapporto={tipiRapporto}
          ruoli={ruoli}
          filtri={filtri}
        />
      )}

      {view === "people" && personaSelezionata && (
        <PersonDetail
          persona={personaSelezionata}
          personeRail={persone.items}
          tab={tab}
          layout={layout}
          mansioni={mansioni}
          reparti={reparti}
          tipiRapporto={tipiRapporto}
          ruoli={ruoli}
          ruoliPersona={ruoliPersona}
          tipiDocumento={tipiDocumento}
          documentiPersona={documentiPersona}
        />
      )}

      {view !== "people" && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          Vista non ancora disponibile in questa fase.
        </div>
      )}
    </div>
  );
}
