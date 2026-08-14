"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, checkboxToBool, numberOrNull, textOrNull } from "@/lib/api";
import type { TurniLavoro } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

export async function upsertTurniLavoro(_prevState: FormState, formData: FormData): Promise<FormState> {
  const payload = {
    presenza_turnazioni: checkboxToBool(formData.get("presenza_turnazioni")),
    tipologia_turno: textOrNull(formData.get("tipologia_turno")),
    numero_turni: numberOrNull(formData.get("numero_turni")),
    fasce_orarie: textOrNull(formData.get("fasce_orarie")),
    rotazione_turni: textOrNull(formData.get("rotazione_turni")),
    lavoro_notturno: checkboxToBool(formData.get("lavoro_notturno")),
    lavoro_festivo: checkboxToBool(formData.get("lavoro_festivo")),
    lavoro_ciclo_continuo: checkboxToBool(formData.get("lavoro_ciclo_continuo")),
    note: textOrNull(formData.get("note")),
  };

  try {
    await apiFetch<TurniLavoro>("/api/anagrafica/turni-lavoro", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  revalidatePath("/anagrafica/turni-lavoro");
  return { success: true };
}
