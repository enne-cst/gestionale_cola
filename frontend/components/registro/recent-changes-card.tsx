"use client";

import { ArrowRightIcon, HistoryIcon } from "lucide-react";

import { useWorkspace } from "@/components/registro/workspace-provider";

function tempoFa(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minuti = Math.round(diffMs / 60000);
  if (minuti < 1) return "adesso";
  if (minuti < 60) return `${minuti} min fa`;
  const ore = Math.round(minuti / 60);
  if (ore < 24) return `${ore} ${ore === 1 ? "ora" : "ore"} fa`;
  const giorni = Math.round(ore / 24);
  return `${giorni} ${giorni === 1 ? "giorno" : "giorni"} fa`;
}

/** Card "Ultime modifiche" (§8.2 del prompt master): alimentata dall'audit
 * del registro campo-per-campo (nel pilota, solo Informazioni societarie). */
export function RecentChangesCard() {
  const { state } = useWorkspace();
  const modifiche = state.overview.recentChanges;

  return (
    <article className="az-dashboard-card relative flex min-h-[276px] flex-col overflow-hidden pb-[50px]">
      <div className="flex min-h-14 items-center gap-2.5 px-[26px] pt-[18px] pb-2.5">
        <span className="grid place-items-center text-[var(--az-blue)]">
          <HistoryIcon className="size-6" />
        </span>
        <h2 className="text-base font-extrabold tracking-tight text-[var(--az-ink)]">Ultime modifiche</h2>
      </div>
      <div className="flex flex-col gap-3.5 px-[28px] py-[10px]">
        {modifiche.length === 0 ? (
          <p className="text-[13px] text-[var(--az-muted)]">Nessuna modifica registrata.</p>
        ) : (
          modifiche.slice(0, 3).map((m) => (
            <div key={m.id} className="flex items-start gap-4">
              <span className="mt-[3px] size-3 shrink-0 rounded-full bg-[var(--az-blue)] shadow-[0_0_0_4px_rgba(7,94,255,0.05)]" />
              <p className="flex flex-col gap-1">
                <strong className="text-[13px] leading-tight text-[var(--az-ink)] capitalize">{m.label}</strong>
                <small className="text-xs leading-tight text-[var(--az-muted)]">
                  {tempoFa(m.timestamp)}
                  {m.actor ? ` · ${m.actor}` : ""}
                </small>
              </p>
            </div>
          ))
        )}
      </div>
      <button
        type="button"
        className="absolute inset-x-0 bottom-0 flex min-h-[50px] items-center gap-3.5 border-t border-[var(--az-border)] bg-[#fbfdfff5] px-[26px] text-sm font-bold text-[var(--az-blue)] transition-colors hover:bg-[#f3f7ff] hover:text-[var(--az-blue-dark)]"
      >
        <HistoryIcon className="size-5" />
        <span className="mr-auto">Vedi cronologia</span>
        <ArrowRightIcon className="size-[18px]" />
      </button>
    </article>
  );
}
