import type { Azienda } from "@/lib/types/auth";

/** Dove mandare un utente autenticato in base al suo profilo: unico punto
 * di questa decisione, riusato dal login e dal layout di ciascuna shell
 * quando un utente finisce nell'area sbagliata (es. un consulente che
 * apre /anagrafica). */
export function destinazioneIniziale(me: { azienda: Azienda | null; profilo: string }): string {
  if (me.azienda) return "/anagrafica";
  if (me.profilo === "SUPERADMIN") return "/superadmin";
  if (me.profilo === "CONSULENTE") return "/consulente";
  return "/login";
}
