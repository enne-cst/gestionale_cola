import type { ReactNode } from "react";

import { AnagraficaBreadcrumb } from "@/components/anagrafica-breadcrumb";
import { AnagraficaNav } from "@/components/anagrafica-nav";
import { BackToOverview } from "@/components/back-to-overview";
import { apiFetch } from "@/lib/api";

export default async function AnagraficaLayout({ children }: { children: ReactNode }) {
  // Sezioni soggette ad abbonamento (cap. 4.1 punto 013): risolte una sola
  // volta qui, condivise da nav, breadcrumb e indice tramite le pagine
  // figlie. Il backend resta comunque l'unica fonte di verità sull'accesso
  // (403 su ogni endpoint non abilitato): questo filtro è solo presentazione.
  const sezioniAbilitate = await apiFetch<string[]>("/api/sezioni");

  return (
    <div>
      {/* Fissa (sticky) rispetto al contenitore di scroll del contenuto
       * (vedi app/(app)/layout.tsx): resta visibile mentre si scorre la
       * pagina, per poter cambiare sezione senza dover tornare in cima. */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="border-b border-border bg-card px-6 py-3">
          <AnagraficaBreadcrumb />
        </div>
        <AnagraficaNav sezioniAbilitate={sezioniAbilitate} />
        <BackToOverview />
      </div>
      <main className="p-8">{children}</main>
    </div>
  );
}
