"use client";

import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

import { CompletenessRing } from "@/components/completeness-ring";
import { useWorkspace } from "@/components/registro/workspace-provider";

export type ProssimaSezioneDaCompletare = { tipo: "drawer"; sectionKey: string } | { tipo: "link"; href: string } | null;

/** Card "Completamento scheda" (§8.2 del prototipo Home): il conteggio copre
 * esattamente le stesse card mostrate più sotto nella pagina ("Dati CCIAA"
 * più le categorie ISO 9001 abilitate), non più le 14 vecchie sezioni "base"
 * (informazioni societarie/sedi/contatti separate) ormai superate dal
 * riordino CCIAA rev2 — richiesta esplicita 05/09/2026, perché il numero
 * deve rispecchiare ciò che l'azienda/il consulente vede e compila davvero.
 * `completate`/`totale` arrivano già calcolati dal chiamante (Server
 * Component) sulle stesse card renderizzate sotto, per non duplicare qui la
 * logica di conteggio. */
export function CompletionCard({
  completate,
  totale,
  prossima,
}: {
  completate: number;
  totale: number;
  prossima: ProssimaSezioneDaCompletare;
}) {
  const { openDrawer } = useWorkspace();
  const percentuale = totale > 0 ? Math.round((completate / totale) * 100) : 0;

  return (
    <article className="az-dashboard-card relative flex min-h-[276px] flex-col overflow-hidden pb-[50px]">
      <div className="flex min-h-14 items-center gap-2.5 px-[26px] pt-[18px] pb-2.5">
        <CheckCircle2Icon className="size-4 text-[var(--az-muted)]" />
        <h2 className="text-base font-extrabold tracking-tight text-[var(--az-ink)]">Completamento scheda</h2>
      </div>
      <div className="flex items-center gap-[34px] px-[30px] py-[10px]">
        <CompletenessRing percentuale={percentuale} />
        <div className="flex flex-col gap-1.5">
          <strong className="text-[22px] leading-none text-[var(--az-ink)]">
            {completate} di {totale}
          </strong>
          <span className="text-sm text-[var(--az-muted)]">sezioni completate</span>
        </div>
      </div>
      {prossima?.tipo === "drawer" && (
        <button
          type="button"
          onClick={() => openDrawer(prossima.sectionKey)}
          className="absolute inset-x-0 bottom-0 flex min-h-[50px] items-center gap-3.5 border-t border-[var(--az-border)] bg-[#fbfdfff5] px-[26px] text-sm font-bold text-[var(--az-blue)] transition-colors hover:bg-[#f3f7ff] hover:text-[var(--az-blue-dark)]"
        >
          <span className="mr-auto">Completa la prossima sezione</span>
          <ArrowRightIcon className="size-[18px] shrink-0" />
        </button>
      )}
      {prossima?.tipo === "link" && (
        <Link
          href={prossima.href}
          className="absolute inset-x-0 bottom-0 flex min-h-[50px] items-center gap-3.5 border-t border-[var(--az-border)] bg-[#fbfdfff5] px-[26px] text-sm font-bold text-[var(--az-blue)] transition-colors hover:bg-[#f3f7ff] hover:text-[var(--az-blue-dark)]"
        >
          <span className="mr-auto">Completa la prossima sezione</span>
          <ArrowRightIcon className="size-[18px] shrink-0" />
        </Link>
      )}
    </article>
  );
}
