"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { CapitaleSociale } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

export async function upsertCapitaleSociale(_prevState: FormState, formData: FormData): Promise<FormState> {
  const payload = {
    valuta: textOrNull(formData.get("valuta")),
    capitale_deliberato: textOrNull(formData.get("capitale_deliberato")),
    capitale_sottoscritto: textOrNull(formData.get("capitale_sottoscritto")),
    capitale_versato: textOrNull(formData.get("capitale_versato")),
  };

  try {
    await apiFetch<CapitaleSociale>("/api/anagrafica/capitale-sociale", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  revalidatePath("/anagrafica/capitale-sociale");
  return { success: true };
}
