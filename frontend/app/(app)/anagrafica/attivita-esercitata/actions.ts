"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, checkboxToBool, textOrNull } from "@/lib/api";
import type { AttivitaEsercitata } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

export async function upsertAttivitaEsercitata(_prevState: FormState, formData: FormData): Promise<FormState> {
  const payload = {
    descrizione_attivita_esercitata: textOrNull(formData.get("descrizione_attivita_esercitata")),
    data_decorrenza_attivita: textOrNull(formData.get("data_decorrenza_attivita")),
    presenza_attivita_import_export: checkboxToBool(formData.get("presenza_attivita_import_export")),
  };

  try {
    await apiFetch<AttivitaEsercitata>("/api/anagrafica/attivita-esercitata", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  revalidatePath("/anagrafica/attivita-esercitata");
  return { success: true };
}
