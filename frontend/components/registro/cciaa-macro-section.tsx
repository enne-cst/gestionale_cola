"use client";

import { ChevronDownIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { COMPRIMI_TUTTE_EVENT, ESPANDI_TUTTE_EVENT } from "@/lib/anagrafica-sezioni";

/** Macrosezione "Dati CCIAA" della Home (§6.2 del protocollo): fonde in
 * un'unica griglia le 4 categorie precedenti (Informazioni societarie, Sedi,
 * Contatti, Dati CCIAA). A differenza di `CorporateSection` (che resta
 * dedicata al solo pannello "Informazioni societarie" del workspace),
 * questa versione ha `id` esplicito sul `<section>` esterno (richiesto dallo
 * scroll-spy di `AnagraficaNav`) e ascolta gli eventi "Espandi/Comprimi
 * tutte" della Home, che `CorporateSection` non ascoltava. */
export function CciaaMacroSection({
  id,
  icon,
  title,
  badge,
  tuttoConfermato = false,
  actions,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  // § richiesta esplicita 05/09/2026: bollino verde quando ogni campo di
  // ogni sottosezione è compilato E confermato — mai quando la macro
  // sezione è semplicemente vuota (nessun campo da confermare non è lo
  // stesso di "tutti confermati"). Calcolato dal chiamante sulle stesse
  // card renderizzate sotto, non ricalcolato qui.
  tuttoConfermato?: boolean;
  // § Correzione 25: pulsanti di funzione del banner (es. "Visualizza
  // sintesi") — a destra del badge, prima del comando di apertura/chiusura
  // qui sotto, sempre visibili sia a elenco aperto sia compresso. Slot
  // generico: questo componente non conosce "sintesi", solo il chiamante
  // (l'unico oggi è la Home per "Dati CCIAA") decide cosa passare qui.
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    function onEspandiTutte() {
      setOpen(true);
    }
    function onComprimiTutte() {
      setOpen(false);
    }
    window.addEventListener(ESPANDI_TUTTE_EVENT, onEspandiTutte);
    window.addEventListener(COMPRIMI_TUTTE_EVENT, onComprimiTutte);
    return () => {
      window.removeEventListener(ESPANDI_TUTTE_EVENT, onEspandiTutte);
      window.removeEventListener(COMPRIMI_TUTTE_EVENT, onComprimiTutte);
    };
  }, []);

  return (
    <section id={id} className="az-dashboard-card @container scroll-mt-24 p-3.5">
      <div className="mb-2.5 flex min-h-12 flex-wrap items-center justify-between gap-2 px-1 pb-2.5">
        <div className="flex items-center gap-3">
          <span className="grid size-[42px] shrink-0 place-items-center rounded-[9px] bg-[var(--az-blue-soft)] text-[var(--az-blue)]">
            {icon}
          </span>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-extrabold tracking-tight text-[var(--az-ink)]">{title}</h2>
            {tuttoConfermato && (
              <span
                className="grid size-5 shrink-0 place-items-center rounded-full bg-[#2cbc82] text-white"
                role="img"
                aria-label="Tutti i campi confermati"
                title="Tutti i campi confermati"
              >
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </span>
            )}
            {badge && (
              <span className="inline-flex min-h-6 items-center rounded-full bg-[#f1f4fa] px-3">{badge}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={`${id}-grid`}
            aria-label={`${open ? "Comprimi" : "Espandi"} ${title}`}
            title={open ? "Comprimi" : "Espandi"}
            className="grid size-[38px] shrink-0 place-items-center rounded-[9px] border border-[#ccd9f1] bg-white text-[var(--az-blue)] hover:bg-[#f7faff]"
          >
            <ChevronDownIcon className={"size-[18px] transition-transform " + (open ? "" : "-rotate-90")} />
          </button>
        </div>
      </div>
      {open && (
        // Container query (non breakpoint di viewport, §6.3): griglia
        // 3-3-3-1 su desktop, 2 colonne sotto ~760px del contenitore, 1
        // colonna sotto ~ancora meno — coerente con l'affiancamento home/
        // dettaglio che restringe il contenitore anche su schermi ampi.
        <div
          id={`${id}-grid`}
          className="grid animate-[az-expand-in_0.18s_ease-out] grid-cols-1 gap-3.5 @lg:grid-cols-2 @4xl:grid-cols-3"
        >
          {children}
        </div>
      )}
    </section>
  );
}
