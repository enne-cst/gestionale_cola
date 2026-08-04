"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { DurataSocietaEsercizi } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

export async function upsertDurataSocietaEsercizi(_prevState: FormState, formData: FormData): Promise<FormState> {
  const payload = {
    data_termine_societa: textOrNull(formData.get("data_termine_societa")),
    scadenza_primo_esercizio: textOrNull(formData.get("scadenza_primo_esercizio")),
    scadenza_esercizi_successivi: textOrNull(formData.get("scadenza_esercizi_successivi")),
  };

  try {
    await apiFetch<DurataSocietaEsercizi>("/api/anagrafica/durata-societa-esercizi", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  revalidatePath("/anagrafica/durata-societa-esercizi");
  return { success: true };
}
