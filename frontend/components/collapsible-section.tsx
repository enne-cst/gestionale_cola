"use client";

import { ChevronDownIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { COMPRIMI_TUTTE_EVENT, ESPANDI_SEZIONE_EVENT, ESPANDI_TUTTE_EVENT } from "@/lib/anagrafica-sezioni";
import { cn } from "@/lib/utils";

/** Sezione della panoramica che si può compattare alla sola intestazione,
 * per non dover scorrere tutte le card quando interessano solo alcune
 * categorie.
 *
 * `icon` va passato già renderizzato (es. `<IconAvatar icon={Building2} />`)
 * e non come riferimento al componente: essendo questo un Client Component,
 * React Server Components non può serializzare un riferimento a componente
 * ricevuto da un Server Component, ma un elemento già risolto sì. */
export function CollapsibleSection({
  id,
  icon,
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (window.location.hash === `#${id}`) setOpen(true);

    function handleEspandi(event: Event) {
      if ((event as CustomEvent<string>).detail === id) setOpen(true);
    }
    function handleHashChange() {
      if (window.location.hash === `#${id}`) setOpen(true);
    }
    function handleEspandiTutte() {
      setOpen(true);
    }
    function handleComprimiTutte() {
      setOpen(false);
    }

    window.addEventListener(ESPANDI_SEZIONE_EVENT, handleEspandi);
    window.addEventListener(ESPANDI_TUTTE_EVENT, handleEspandiTutte);
    window.addEventListener(COMPRIMI_TUTTE_EVENT, handleComprimiTutte);
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener(ESPANDI_SEZIONE_EVENT, handleEspandi);
      window.removeEventListener(ESPANDI_TUTTE_EVENT, handleEspandiTutte);
      window.removeEventListener(COMPRIMI_TUTTE_EVENT, handleComprimiTutte);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [id]);

  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 border-b border-border pb-3 text-left"
      >
        {icon}
        <div className="flex flex-1 items-center gap-2.5">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {subtitle}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          {open ? "Comprimi" : "Espandi"}
          <ChevronDownIcon className={cn("size-3.5 shrink-0 transition-transform", !open && "-rotate-90")} />
        </span>
      </button>
      {open && <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>}
    </section>
  );
}
