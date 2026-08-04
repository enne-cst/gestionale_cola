import Link from "next/link";
import type { ReactNode } from "react";

/** Barra superiore globale (titolo app), comune a tutte le shell
 * (azienda e consulente). Il contenuto a destra (azienda, utente, logout)
 * è deciso da chi la usa: questo componente è solo la cornice. */
export function TopBar({ children }: { children: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <Link href="/" className="text-lg font-semibold text-primary">
        Gestionale Cola
      </Link>
      <div className="flex items-center gap-3">{children}</div>
    </header>
  );
}
