import Link from "next/link";
import type { ReactNode } from "react";

import { AnagraficaBreadcrumb } from "@/components/anagrafica-breadcrumb";
import { AnagraficaNav } from "@/components/anagrafica-nav";

export default function AnagraficaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 border-b-2 border-primary bg-card px-6 py-4">
        <Link href="/" className="font-semibold text-primary">
          Gestionale Cola
        </Link>
        <span className="text-muted-foreground">/</span>
        <AnagraficaBreadcrumb />
      </header>
      <div className="flex flex-1">
        <AnagraficaNav />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
