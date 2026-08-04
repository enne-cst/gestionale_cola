"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { IdentificazioneCamerale } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

export async function upsertIdentificazioneCamerale(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = {
    ragione_sociale: textOrNull(formData.get("ragione_sociale")),
    forma_giuridica: textOrNull(formData.get("forma_giuridica")),
    codice_fiscale: textOrNull(formData.get("codice_fiscale")),
    partita_iva: textOrNull(formData.get("partita_iva")),
    camera_commercio_competente: textOrNull(formData.get("camera_commercio_competente")),
    ufficio_registro_imprese: textOrNull(formData.get("ufficio_registro_imprese")),
    numero_rea: textOrNull(formData.get("numero_rea")),
    provincia_rea: textOrNull(formData.get("provincia_rea")),
    stato_attivita: textOrNull(formData.get("stato_attivita")),
    data_atto_costitutivo: textOrNull(formData.get("data_atto_costitutivo")),
    data_inizio_attivita: textOrNull(formData.get("data_inizio_attivita")),
    data_ultimo_protocollo: textOrNull(formData.get("data_ultimo_protocollo")),
  };

  try {
    await apiFetch<IdentificazioneCamerale>("/api/anagrafica/identificazione-camerale", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  revalidatePath("/anagrafica/identificazione-camerale");
  return { success: true };
}
