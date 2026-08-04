"use client";

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { MODULI } from "@/lib/moduli";
import { cn } from "@/lib/utils";

const CHIAVE_STORAGE_COLLASSATA = "gestionale-cola:sidebar-collassata";

/** Navbar laterale dei moduli applicativi (Anagrafica Aziendale, e in
 * futuro Personale, Documenti, ...): resta fuori dall'area di scroll del
 * contenuto (vedi app/(app)/layout.tsx), quindi rimane sempre visibile
 * mentre si scorre dentro un modulo. Collassabile a sola icona, stato
 * ricordato tra le sessioni via localStorage. */
export function ModuleSidebar() {
  const pathname = usePathname();
  const [collassata, setCollassata] = useState(false);

  useEffect(() => {
    setCollassata(window.localStorage.getItem(CHIAVE_STORAGE_COLLASSATA) === "true");
  }, []);

  function toggleCollassata() {
    setCollassata((precedente) => {
      const prossima = !precedente;
      window.localStorage.setItem(CHIAVE_STORAGE_COLLASSATA, String(prossima));
      return prossima;
    });
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col overflow-y-auto border-r border-border bg-card p-3 transition-[width] duration-200",
        collassata ? "w-16" : "w-60",
      )}
    >
      <button
        type="button"
        onClick={toggleCollassata}
        title={collassata ? "Espandi navbar" : "Comprimi navbar"}
        className={cn(
          "mb-2 flex shrink-0 items-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
          collassata ? "justify-center" : "justify-end",
        )}
      >
        {collassata ? <PanelLeftOpenIcon className="size-4" /> : <PanelLeftCloseIcon className="size-4" />}
      </button>
      <div className="flex shrink-0 flex-col gap-1">
        {MODULI.map((modulo) => {
          const Icon = modulo.icon;
          const attivo = pathname.startsWith(modulo.basePath);

          return (
            <Link
              key={modulo.basePath}
              href={modulo.href}
              title={modulo.nome}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                collassata && "justify-center px-0",
                attivo && "bg-secondary text-primary",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collassata && modulo.nome}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
