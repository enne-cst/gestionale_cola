"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { ContrattoLavoro } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

export async function upsertContrattoLavoro(_prevState: FormState, formData: FormData): Promise<FormState> {
  const payload = {
    ccnl_applicato: formData.get("ccnl_applicato") as string,
    settore_ccnl: formData.get("settore_ccnl") as string,
    data_applicazione: formData.get("data_applicazione") as string,
    ccnl_precedente: textOrNull(formData.get("ccnl_precedente")),
    note: textOrNull(formData.get("note")),
  };

  try {
    await apiFetch<ContrattoLavoro>("/api/anagrafica/contratto-lavoro", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  revalidatePath("/anagrafica/contratto-lavoro");
  return { success: true };
}
