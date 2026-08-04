import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import { TopBar } from "@/components/top-bar";
import { ApiError, apiFetch } from "@/lib/api";
import { destinazioneIniziale } from "@/lib/auth-destinazione";
import type { MeResponse } from "@/lib/types/auth";

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  let me: MeResponse;
  try {
    me = await apiFetch<MeResponse>("/api/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    throw error;
  }

  // Autenticato ma con il ruolo sbagliato per quest'area: lo rimandiamo
  // alla sua, non al login.
  if (me.profilo !== "SUPERADMIN") redirect(destinazioneIniziale(me));

  return (
    <div className="flex h-screen flex-col">
      <TopBar>
        <span className="text-sm text-muted-foreground">
          {me.utente.nome} {me.utente.cognome}
        </span>
        <LogoutButton />
      </TopBar>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
