"use server";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";

export type NuovaAziendaResult = { id: string; ragione_sociale: string; email: string };
export type FormState = { error?: string; success?: NuovaAziendaResult };

export async function creaAzienda(_prevState: FormState, formData: FormData): Promise<FormState> {
  const payload = {
    ragione_sociale: textOrNull(formData.get("ragione_sociale")),
    partita_iva: textOrNull(formData.get("partita_iva")),
    codice_fiscale: textOrNull(formData.get("codice_fiscale")),
    nome_referente: textOrNull(formData.get("nome_referente")),
    cognome_referente: textOrNull(formData.get("cognome_referente")),
    email: textOrNull(formData.get("email")),
    password: textOrNull(formData.get("password")),
  };

  try {
    const azienda = await apiFetch<NuovaAziendaResult>("/api/consulente/aziende", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { success: azienda };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
}
