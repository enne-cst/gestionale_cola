"use server";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";

export type NuovoConsulenteResult = { id: string; nome: string; cognome: string; email: string };
export type FormState = { error?: string; success?: NuovoConsulenteResult };

export async function creaConsulente(_prevState: FormState, formData: FormData): Promise<FormState> {
  const payload = {
    nome: textOrNull(formData.get("nome")),
    cognome: textOrNull(formData.get("cognome")),
    email: textOrNull(formData.get("email")),
    password: textOrNull(formData.get("password")),
  };

  try {
    const consulente = await apiFetch<NuovoConsulenteResult>("/api/superadmin/consulenti", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { success: consulente };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
}
