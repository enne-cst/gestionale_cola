"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { SEZIONI_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { cn } from "@/lib/utils";

export function AnagraficaNav() {
  const pathname = usePathname();

  const categorie = [...new Set(SEZIONI_ANAGRAFICA.map((s) => s.categoria))];

  return (
    <nav className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card/50 p-4 text-sm">
      {categorie.map((categoria) => (
        <Fragment key={categoria}>
          <div>
            <p className="mb-1 flex items-center gap-1.5 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {categoria}
            </p>
            <ul className="flex flex-col gap-0.5">
              {SEZIONI_ANAGRAFICA.filter((s) => s.categoria === categoria).map((sezione) => {
                const href = `/anagrafica/${sezione.slug}`;
                const attiva = pathname === href;
                const Icon = SEZIONE_ICONE[sezione.slug];

                return (
                  <li key={sezione.slug}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground",
                        attiva && "bg-primary/10 font-medium text-primary hover:bg-primary/10 hover:text-primary",
                      )}
                    >
                      {Icon && <Icon className="size-4 shrink-0" />}
                      {sezione.titolo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </Fragment>
      ))}
    </nav>
  );
}
