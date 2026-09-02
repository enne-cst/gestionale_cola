"use client";

import { ChevronDownIcon, HistoryIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Blocco storico dietro un pulsante (§ correzione richiesta esplicitamente
 * dall'utente su "Personale e occupazione"): la tabella esiste solo per
 * consultare lo storico delle rilevazioni passate, non è più aperta di
 * default — un pulsante con freccia la mostra/nasconde. Il contenuto (le
 * tabelle `AddettiVisuraTable`/`AddettiComuneTable` esistenti, invariate) si
 * monta solo quando aperto: nessuna riscrittura della tabella stessa, solo
 * un contenitore diverso attorno ad essa. */
export function CollapsibleStorico({ titolo, children }: { titolo: string; children: ReactNode }) {
  const [aperto, setAperto] = useState(false);
  return (
    <div className="border-b border-[var(--az-border)] py-6 last:border-b-0">
      <button
        type="button"
        onClick={() => setAperto((v) => !v)}
        aria-expanded={aperto}
        className="inline-flex items-center gap-2 text-[13px] font-bold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]"
      >
        <HistoryIcon className="size-4" />
        {titolo}
        <ChevronDownIcon className={cn("size-4 transition-transform", !aperto && "-rotate-90")} />
      </button>
      {aperto && <div className="mt-4">{children}</div>}
    </div>
  );
}
