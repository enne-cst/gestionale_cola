"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, numberOrNull, textOrNull } from "@/lib/api";
import type { AmministrazioneControllo } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

export async function upsertAmministrazioneControllo(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const sistemiAmministrazione = formData
    .getAll("sistema_amministrazione")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value !== "")
    .map((sistema_amministrazione) => ({ sistema_amministrazione }));

  const payload = {
    numero_minimo_amministratori: numberOrNull(formData.get("numero_minimo_amministratori")),
    numero_amministratori_in_carica: numberOrNull(formData.get("numero_amministratori_in_carica")),
    durata_in_carica_organo: textOrNull(formData.get("durata_in_carica_organo")),
    numero_sindaci_organi_controllo: numberOrNull(formData.get("numero_sindaci_organi_controllo")),
    numero_titolari_cariche: numberOrNull(formData.get("numero_titolari_cariche")),
    sistemi_amministrazione: sistemiAmministrazione,
  };

  try {
    await apiFetch<AmministrazioneControllo>("/api/anagrafica/amministrazione-controllo", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  revalidatePath("/anagrafica/amministrazione-controllo");
  return { success: true };
}
