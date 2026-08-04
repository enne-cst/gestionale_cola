"use client";

import { LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CATEGORIA_ICONE } from "@/lib/anagrafica-icons";
import { CATEGORIE_ANAGRAFICA, ESPANDI_SEZIONE_EVENT, sezioneBySlug } from "@/lib/anagrafica-sezioni";
import { cn } from "@/lib/utils";

export function AnagraficaNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [categoriaVisibile, setCategoriaVisibile] = useState<string | null>(null);

  const slugCorrente = pathname.split("/")[2];
  const inPanoramica = pathname === "/anagrafica/panoramica";
  const inIndice = pathname === "/anagrafica";

  // Scroll-spy: nella pagina indice (/anagrafica) il pathname non cambia mai
  // mentre si scorre tra le categorie, quindi la tab attiva segue invece la
  // categoria che si trova appena sotto la barra sticky in quel momento.
  // Nelle altre pagine del modulo resta valido il solo confronto sul path.
  useEffect(() => {
    if (!inIndice) {
      setCategoriaVisibile(null);
      return;
    }

    const sezioni = CATEGORIE_ANAGRAFICA.map((c) => document.getElementById(c.slug)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sezioni.length === 0) return;

    const altezzaBarra = navRef.current?.getBoundingClientRect().bottom ?? 0;
    const visibili = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibili.add(entry.target.id);
          else visibili.delete(entry.target.id);
        });
        const primaVisibile = CATEGORIE_ANAGRAFICA.find((c) => visibili.has(c.slug));
        setCategoriaVisibile(primaVisibile?.slug ?? null);
      },
      { rootMargin: `-${altezzaBarra}px 0px -70% 0px` },
    );
    sezioni.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [inIndice]);

  const categoriaCorrente = inIndice
    ? CATEGORIE_ANAGRAFICA.find((c) => c.slug === categoriaVisibile)?.nome
    : slugCorrente
      ? sezioneBySlug(slugCorrente)?.categoria
      : undefined;

  return (
    <nav ref={navRef} className="flex items-center gap-1 overflow-x-auto border-b border-border bg-card px-6">
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
