"use client";

import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react";

import { CompletenessRing } from "@/components/completeness-ring";
import { useWorkspace } from "@/components/registro/workspace-provider";

/** KPI "Qualità dei dati" (§8.2/§12.2 del prompt master): visibile sia al
 * Consulente sia all'Azienda, calcolata lato server su tutte le sezioni che
 * adottano il registro campo-per-campo (nel pilota, solo Informazioni
 * societarie). */
export function QualityCard() {
  const { state } = useWorkspace();
  const quality = state.overview.quality;
  if (!quality) return null;

  return (
    <article className="az-dashboard-card relative flex min-h-[276px] flex-col overflow-hidden pb-[50px]">
      <div className="flex min-h-14 items-center gap-2.5 px-[26px] pt-[18px] pb-2.5">
        <span className="grid place-items-center text-[var(--az-green)]">
          <ShieldCheckIcon className="size-[25px]" />
        </span>
        <h2 className="text-base font-extrabold tracking-tight text-[var(--az-ink)]">Qualità dei dati</h2>
      </div>
      <div className="flex items-center gap-[26px] px-[30px] py-[10px]">
        <CompletenessRing percentuale={quality.percentage} tone="green" />
        <div className="flex min-w-0 flex-col gap-[17px]">
          <div className="flex items-start gap-3">
            <span className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-[#2cbc82] text-white">
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </span>
            <p className="flex min-w-0 flex-col gap-1">
              <strong className="text-[13px] leading-tight text-[var(--az-ink)]">
                {quality.verified} element{quality.verified === 1 ? "o" : "i"} verificat{quality.verified === 1 ? "o" : "i"}
              </strong>
              <small className="text-xs leading-tight text-[var(--az-muted)]">dati verificati dal consulente</small>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-px size-4 shrink-0 rounded-full border-2 border-[#ff7a00] bg-white" />
            <p className="flex min-w-0 flex-col gap-1">
              <strong className="text-[13px] leading-tight text-[var(--az-ink)]">
                {quality.pending} da verificare
              </strong>
              <small className="text-xs leading-tight text-[var(--az-muted)]">
                {quality.revisionRequired} da revisionare
              </small>
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="absolute inset-x-0 bottom-0 flex min-h-[50px] items-center gap-3.5 border-t border-[var(--az-border)] bg-gradient-to-r from-[#f0fbf7f2] to-[#e8f8f1eb] px-[26px] text-sm font-bold text-[var(--az-green-dark)] transition-colors hover:bg-[#e5f7f0] hover:text-[#00765a]"
      >
        <ShieldCheckIcon className="size-[22px]" />
        <span className="mr-auto">Visualizza verifiche</span>
        <ArrowRightIcon className="size-[18px]" />
      </button>
    </article>
  );
}
