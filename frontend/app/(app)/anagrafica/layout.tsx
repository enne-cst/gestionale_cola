import type { ReactNode } from "react";

import { AnagraficaBreadcrumb } from "@/components/anagrafica-breadcrumb";
import { AnagraficaNav } from "@/components/anagrafica-nav";
import { BackToOverview } from "@/components/back-to-overview";

export default function AnagraficaLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {/* Fissa (sticky) rispetto al contenitore di scroll del contenuto
       * (vedi app/(app)/layout.tsx): resta visibile mentre si scorre la
       * pagina, per poter cambiare sezione senza dover tornare in cima. */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="border-b border-border bg-card px-6 py-3">
          <AnagraficaBreadcrumb />
        </div>
        <AnagraficaNav />
        <BackToOverview />
      </div>
      <main className="p-8">{children}</main>
    </div>
  );
}
