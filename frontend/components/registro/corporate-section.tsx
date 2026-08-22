"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

/** Macrosezione "Informazioni societarie" della Home (§5.1/§28.2 del prompt
 * master): comando di apertura/chiusura solo icona (correzione esplicita
 * §2 — nessun testo "Comprimi"/"Espandi" visibile), coerente con la
 * freccetta usata dalle altre macrosezioni della pagina.
 *
 * `icon` va passato già renderizzato (come per `CollapsibleSection`): un
 * riferimento a componente icona non è serializzabile dal Server Component
 * chiamante verso questo Client Component, un elemento già risolto sì. */
export function CorporateSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="az-dashboard-card @container p-3.5">
      <div className="mb-2.5 flex min-h-12 items-center justify-between gap-2 px-1 pb-2.5">
        <div className="flex items-center gap-3">
          <span className="grid size-[42px] shrink-0 place-items-center rounded-[9px] bg-[var(--az-blue-soft)] text-[var(--az-blue)]">
            {icon}
          </span>
          <h2 className="text-base font-extrabold tracking-tight text-[var(--az-ink)]">{title}</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="informazioni-societarie-grid"
          aria-label={`${open ? "Comprimi" : "Espandi"} ${title}`}
          title={open ? "Comprimi" : "Espandi"}
          className="grid size-[38px] shrink-0 place-items-center rounded-[9px] border border-[#ccd9f1] bg-white text-[var(--az-blue)] hover:bg-[#f7faff]"
        >
          <ChevronDownIcon className={"size-[18px] transition-transform " + (open ? "" : "-rotate-90")} />
        </button>
      </div>
      {open && (
        // Container query (non breakpoint di viewport): questa griglia deve
        // reflowire in base alla propria larghezza, non a quella della
        // finestra — nell'affiancamento home/dettaglio (§8.4) il contenitore
        // è largo ~50% della pagina anche su schermi ampi.
        <div
          id="informazioni-societarie-grid"
          className="grid animate-[az-expand-in_0.18s_ease-out] grid-cols-1 gap-3.5 @sm:grid-cols-2 @3xl:grid-cols-4"
        >
          {children}
        </div>
      )}
    </section>
  );
}
