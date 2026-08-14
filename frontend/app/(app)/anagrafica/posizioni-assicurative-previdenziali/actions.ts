"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api";
import type { PosizioniAssicurativePrevidenziali } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

export async function upsertPosizioniAssicurativePrevidenziali(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = {
    numero_posizione_inps: formData.get("numero_posizione_inps") as string,
    sede_territoriale_inps: formData.get("sede_territoriale_inps") as string,
    numero_posizione_inail: formData.get("numero_posizione_inail") as string,
    sede_territoriale_inail: formData.get("sede_territoriale_inail") as string,
  };

  try {
    await apiFetch<PosizioniAssicurativePrevidenziali>("/api/anagrafica/posizioni-assicurative-previdenziali", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  revalidatePath("/anagrafica/posizioni-assicurative-previdenziali");
  return { success: true };
}
