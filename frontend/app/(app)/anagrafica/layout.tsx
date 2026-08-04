import { Building2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AnagraficaBreadcrumb } from "@/components/anagrafica-breadcrumb";
import { AnagraficaNav } from "@/components/anagrafica-nav";
import { BackToOverview } from "@/components/back-to-overview";
import { apiFetch } from "@/lib/api";
import type { AziendaCorrente } from "@/lib/types/sistema";

export default async function AnagraficaLayout({ children }: { children: ReactNode }) {
  const azienda = await apiFetch<AziendaCorrente>("/api/sistema/azienda-corrente");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-primary">
            Gestionale Cola
          </Link>
          <span className="text-muted-foreground">/</span>
          <AnagraficaBreadcrumb />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
          <Building2 className="size-4 text-primary" />
          {azienda.ragione_sociale}
        </div>
      </header>
      <AnagraficaNav />
      <BackToOverview />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
