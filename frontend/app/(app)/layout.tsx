import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AziendaPill } from "@/components/azienda-pill";
import { LogoutButton } from "@/components/logout-button";
import { ModuleSidebar } from "@/components/module-sidebar";
import { TopBar } from "@/components/top-bar";
import { ApiError, apiFetch } from "@/lib/api";
import { destinazioneIniziale } from "@/lib/auth-destinazione";
import type { MeResponse } from "@/lib/types/auth";

/** Shell comune a tutti i moduli applicativi: barra superiore fissa
 * (titolo app + azienda + utente) e navbar laterale dei moduli, anch'essa
 * fissa. Solo l'area di contenuto scorre (vedi overflow-y-auto sotto), così
 * barra superiore e navbar restano visibili durante lo scroll. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  let me: MeResponse;
  try {
    me = await apiFetch<MeResponse>("/api/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    throw error;
  }

  // Nessuna azienda associata (es. un consulente o un super admin finito
  // qui per errore): non è il posto giusto per lui, va rimandato alla sua area.
  if (!me.azienda) redirect(destinazioneIniziale(me));

  return (
    <div className="flex h-screen flex-col">
      <TopBar>
        <span className="text-sm text-muted-foreground">
          {me.utente.nome} {me.utente.cognome}
        </span>
        <AziendaPill ragioneSociale={me.azienda.ragione_sociale} />
        <LogoutButton />
      </TopBar>
      <div className="flex flex-1 overflow-hidden">
        <ModuleSidebar />
        {/* Niente "flex flex-col" qui: un contenitore flex la cui altezza è
         * vincolata dal genitore ridurrebbe (shrink) i figli più alti dello
         * spazio disponibile invece di farli scorrere. Un contenitore a
         * blocco normale lascia crescere il contenuto e overflow-y-auto lo
         * rende scorrevole senza comprimerlo. */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
