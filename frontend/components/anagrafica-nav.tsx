"use client";

import { LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CATEGORIA_ICONE } from "@/lib/anagrafica-icons";
import { CATEGORIE_ANAGRAFICA, ESPANDI_SEZIONE_EVENT, sezioneBySlug } from "@/lib/anagrafica-sezioni";
import { cn } from "@/lib/utils";

export function AnagraficaNav() {
  const pathname = usePathname();

  const slugCorrente = pathname.split("/")[2];
  const categoriaCorrente = slugCorrente ? sezioneBySlug(slugCorrente)?.categoria : undefined;
  const inPanoramica = pathname === "/anagrafica/panoramica";

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-border bg-card px-6">
      <Link
        href="/anagrafica/panoramica"
        className={cn(
          "flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
          inPanoramica && "border-primary text-primary",
        )}
      >
        <LayoutDashboardIcon className="size-4" />
        Panoramica
      </Link>
      {CATEGORIE_ANAGRAFICA.map((categoria) => {
        const Icon = CATEGORIA_ICONE[categoria.nome];
        const attiva = categoria.nome === categoriaCorrente;

        return (
          <Link
            key={categoria.slug}
            href={`/anagrafica#${categoria.slug}`}
            onClick={() => {
              // Un cambio di solo hash su Next.js non genera sempre un
              // 'hashchange' nativo: segnaliamo esplicitamente alla sezione
              // di riaprirsi se era stata compattata.
              window.dispatchEvent(new CustomEvent(ESPANDI_SEZIONE_EVENT, { detail: categoria.slug }));
            }}
            className={cn(
              "flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
              attiva && "border-primary text-primary",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {categoria.nome}
          </Link>
        );
      })}
    </nav>
  );
}
