"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AZIENDA_ATTIVA_COOKIE_NAME } from "@/lib/azienda-attiva-cookie";

/** Fa "entrare" un consulente nel contesto di un'azienda cliente: il cookie
 * scritto qui è solo un suggerimento per il backend (vedi lib/api.ts), che
 * lo riverifica ad ogni richiesta (app.core.deps.get_current_azienda) —
 * scaduto insieme al cookie di sessione, mai più a lungo. */
export async function entraInAzienda(aziendaId: string): Promise<void> {
  (await cookies()).set(AZIENDA_ATTIVA_COOKIE_NAME, aziendaId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect("/anagrafica");
}

export async function esciDaAzienda(): Promise<void> {
  (await cookies()).delete(AZIENDA_ATTIVA_COOKIE_NAME);
  redirect("/consulente");
}
