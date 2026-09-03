"use client";

import type { ReactNode } from "react";

import { useWorkspace } from "@/components/registro/workspace-provider";
import { cn } from "@/lib/utils";

export type CciaaSectionCardStato = {
  confermate: number;
  daVerificare: number;
  daRevisionare: number;
};

/** Riquadro della griglia "Dati CCIAA" (§6.3/§6.4 del protocollo): icona,
 * titolo, indicatore generale, "N di N informazioni presenti" e, solo per le
 * sezioni effettivamente a registro campo-per-campo, la riga a tre pallini
 * confermato/da verificare/da revisionare. Per le altre card `stato` è
 * `null`: niente pallini inventati, solo il conteggio di presenza (§18 del
 * protocollo — non dedurre stati non tracciati). */
export function CciaaSectionCard({
  icon,
  title,
  presenti,
  totale,
  stato,
  sectionKey,
}: {
  // Già renderizzato dal chiamante (Server Component), non un riferimento a
  // componente: un riferimento a icona non è serializzabile attraverso il
  // confine Server -> Client, un elemento già risolto sì (stesso principio
  // già in uso in `corporate-section.tsx`).
  icon: ReactNode;
  title: string;
  presenti: number;
  totale: number;
  stato: CciaaSectionCardStato | null;
  sectionKey: string;
}) {
  const { openDrawer } = useWorkspace();

  return (
    <article className="flex min-h-[164px] flex-col gap-3 rounded-[11px] border border-[#dce5f3] bg-white p-[15px_16px_14px] transition-[transform,box-shadow,border-color] hover:-translate-y-px hover:border-[#ccdaef] hover:shadow-[0_8px_20px_rgba(26,46,94,0.07)]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-[var(--az-blue-soft)] text-[var(--az-blue)]">
          {icon}
        </span>
        <h3 className="min-w-0 text-[12.5px] font-extrabold text-[var(--az-ink)]">{title}</h3>
      </div>

      <div className="flex flex-col">
        <strong className="text-sm leading-none text-[var(--az-ink)]">
          {presenti} di {totale}
        </strong>
        <span className="mt-1 text-[11px] text-[var(--az-muted)]">informazioni presenti</span>
      </div>

      {stato && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--az-muted)]">
          <span className="inline-flex items-center gap-[5px]">
            <span className="inline-block size-2 shrink-0 rounded-full bg-[#08a77e]" aria-hidden="true" />
            {stato.confermate} confermate
          </span>
          <span className="inline-flex items-center gap-[5px]">
            <span className="inline-block size-2 shrink-0 rounded-full bg-[#d7192d]" aria-hidden="true" />
            {stato.daVerificare} da verificare
          </span>
          <span className="inline-flex items-center gap-[5px]">
            <span className="inline-block size-2 shrink-0 rounded-full bg-[#ee7203]" aria-hidden="true" />
            {stato.daRevisionare} da revisionare
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => openDrawer(sectionKey)}
        className={cn(
          "mt-auto inline-flex cursor-pointer items-center gap-3.5 self-start pt-2 text-[12.5px] font-bold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]",
        )}
      >
        <span>Visualizza dettagli</span>
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m14 7 5 5-5 5" />
        </svg>
      </button>
    </article>
  );
}
