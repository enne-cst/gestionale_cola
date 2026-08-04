"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, numberOrNull, textOrNull } from "@/lib/api";
import type { AddettiVisura } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  const periodi = formData.getAll("vp_periodo");
  const dipendenti = formData.getAll("vp_numero_dipendenti");
  const indipendenti = formData.getAll("vp_numero_indipendenti");
  const collaboratori = formData.getAll("vp_numero_collaboratori");
  const totali = formData.getAll("vp_numero_totale_addetti");
  const pctDeterminato = formData.getAll("vp_pct_determinato");
  const pctIndeterminato = formData.getAll("vp_pct_indeterminato");
  const pctPieno = formData.getAll("vp_pct_pieno");
  const pctParziale = formData.getAll("vp_pct_parziale");
  const pctOperai = formData.getAll("vp_pct_operai");
  const pctImpiegati = formData.getAll("vp_pct_impiegati");

  const periodiRilevazione = periodi
    .map((periodo, i) => ({
      periodo,
      numero_dipendenti: numberOrNull(dipendenti[i]),
      numero_indipendenti: numberOrNull(indipendenti[i]),
      numero_collaboratori: numberOrNull(collaboratori[i]),
      numero_totale_addetti: numberOrNull(totali[i]),
      percentuale_tempo_determinato: numberOrNull(pctDeterminato[i]),
      percentuale_tempo_indeterminato: numberOrNull(pctIndeterminato[i]),
      percentuale_tempo_pieno: numberOrNull(pctPieno[i]),
      percentuale_tempo_parziale: numberOrNull(pctParziale[i]),
      percentuale_operai: numberOrNull(pctOperai[i]),
      percentuale_impiegati: numberOrNull(pctImpiegati[i]),
    }))
    .filter((p) => typeof p.periodo === "string" && p.periodo !== "");

  return {
    fonte: textOrNull(formData.get("fonte")),
    anno_riferimento: numberOrNull(formData.get("anno_riferimento")),
    data_rilevazione: textOrNull(formData.get("data_rilevazione")),
    periodi: periodiRilevazione,
  };
}

export async function createAddettiVisura(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<AddettiVisura>("/api/anagrafica/addetti-visura", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/addetti-visura");
  return { success: true };
}

export async function updateAddettiVisura(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await apiFetch<AddettiVisura>(`/api/anagrafica/addetti-visura/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/addetti-visura");
  return { success: true };
}

export async function deleteAddettiVisura(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/addetti-visura/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/addetti-visura");
}
