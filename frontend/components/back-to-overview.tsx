"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { categoriaSlug, sezioneBySlug } from "@/lib/anagrafica-sezioni";

/** Barra di rientro mostrata sopra il contenuto di ogni sottopagina del
 * modulo (non sulla panoramica stessa): rende esplicito che ci si trova
 * nel dettaglio di una sezione e offre un modo diretto per tornare alla
 * panoramica, così la tab bar da sola non è l'unico riferimento. */
export function BackToOverview() {
  const pathname = usePathname();
  const slug = pathname.split("/")[2];
  const sezione = slug ? sezioneBySlug(slug) : undefined;

  if (!sezione) return null;

  return (
    <div className="border-b border-border bg-muted/40 px-6 py-2">
      <Link
        href={`/anagrafica#${categoriaSlug(sezione.categoria)}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Torna alla panoramica
      </Link>
    </div>
  );
}
