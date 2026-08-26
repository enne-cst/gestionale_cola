"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { Sede } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  const attivitaDescrizioni = formData.getAll("att_descrizione");
  const attivitaInizio = formData.getAll("att_data_inizio");
  const attivitaFine = formData.getAll("att_data_fine");
  const attivitaRuolo = formData.getAll("att_ruolo_importanza");

  const attivita = attivitaDescrizioni
    .map((descrizione, i) => ({
      descrizione_attivita: typeof descrizione === "string" ? descrizione.trim() : "",
      data_inizio: textOrNull(attivitaInizio[i]),
      data_fine: textOrNull(attivitaFine[i]),
      ruolo_importanza: textOrNull(attivitaRuolo[i]),
    }))
    .filter((a) => a.descrizione_attivita !== "");

  return {
    tipo_sede: formData.get("tipo_sede") as string,
    numero_unita_locale: textOrNull(formData.get("numero_unita_locale")),
    denominazione_sede: textOrNull(formData.get("denominazione_sede")),
    data_apertura: textOrNull(formData.get("data_apertura")),
    indirizzo: textOrNull(formData.get("indirizzo")),
    numero_civico: textOrNull(formData.get("numero_civico")),
    cap: textOrNull(formData.get("cap")),
    comune: textOrNull(formData.get("comune")),
    provincia: textOrNull(formData.get("provincia")),
    frazione: textOrNull(formData.get("frazione")),
    nazione: textOrNull(formData.get("nazione")),
    toponimo: textOrNull(formData.get("toponimo")),
    indirizzo_originale: textOrNull(formData.get("indirizzo_originale")),
    numero_rea_unita: textOrNull(formData.get("numero_rea_unita")),
    data_chiusura: textOrNull(formData.get("data_chiusura")),
    stato: textOrNull(formData.get("stato")),
    sigla_territoriale: textOrNull(formData.get("sigla_territoriale")),
    numero_progressivo: textOrNull(formData.get("numero_progressivo")),
    attivita,
  };
}

export async function createSede(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Sede>("/api/anagrafica/sedi", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/sedi");
  return { success: true };
}

export async function updateSede(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Sede>(`/api/anagrafica/sedi/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/sedi");
  return { success: true };
}

export async function deleteSede(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/sedi/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/sedi");
}
