"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, apiFetchResult, checkboxToBool, textOrNull } from "@/lib/api";
import type { CatalogoVoce } from "@/lib/types/anagrafica-iso9001";
import type { UnitaLocaleDetail, UnitaLocaleSummary } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

const PATH = "/api/anagrafica/unita-locali";
const REVALIDATE_PATH = "/anagrafica";

/** Vista riepilogativa per la tabella (§ punto 2). */
export async function getUnitaLocali(): Promise<UnitaLocaleSummary[]> {
  return apiFetch<UnitaLocaleSummary[]>(PATH);
}

/** Dettaglio per il form completo (§ punto 8). */
export async function getUnitaLocale(id: string): Promise<UnitaLocaleDetail> {
  return apiFetch<UnitaLocaleDetail>(`${PATH}/${id}`);
}

export type NomeCatalogoUnitaLocali = "tipologie" | "stati" | "codici-ateco";

export async function getCatalogoUnitaLocali(nome: NomeCatalogoUnitaLocali): Promise<CatalogoVoce[]> {
  return apiFetch<CatalogoVoce[]>(`${PATH}/cataloghi/${nome}`);
}

export type EsitoVerificaUnitaLocale =
  | { esito: "ok"; unita: UnitaLocaleDetail }
  | { esito: "conflitto" }
  | { esito: "errore"; messaggio: string };

function messaggioGenerico(detail: unknown): string {
  return typeof detail === "string" ? detail : "Errore imprevisto. Riprova.";
}

export async function inviaVerificaUnitaLocale(
  id: string,
  decision: "VERIFIED" | "REVISION_REQUIRED",
  note: string | null,
  expectedFieldVersion: number | null,
): Promise<EsitoVerificaUnitaLocale> {
  const result = await apiFetchResult<UnitaLocaleDetail>(`${PATH}/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, note, expectedFieldVersion }),
  });
  if (result.ok) return { esito: "ok", unita: result.data };
  if (result.status === 409) return { esito: "conflitto" };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}

function payloadUnitaLocale(formData: FormData) {
  const attivitaDescrizioni = formData.getAll("att_descrizione");
  const attivitaInizio = formData.getAll("att_data_inizio");
  const attivitaFine = formData.getAll("att_data_fine");
  const attivitaPrincipale = formData.getAll("att_principale");
  const attivita = attivitaDescrizioni
    .map((descrizione, i) => ({
      descrizione_attivita: typeof descrizione === "string" ? descrizione.trim() : "",
      data_inizio: textOrNull(attivitaInizio[i]),
      data_fine: textOrNull(attivitaFine[i]),
      attivita_principale: checkboxToBool(attivitaPrincipale[i]),
    }))
    .filter((a) => a.descrizione_attivita !== "");

  const atecoCodiceId = formData.getAll("ateco_codice_id");
  const atecoPrincipale = formData.getAll("ateco_principale");
  const atecoInizio = formData.getAll("ateco_data_inizio");
  const atecoFine = formData.getAll("ateco_data_fine");
  const codici_ateco = atecoCodiceId
    .map((codice_attivita_id, i) => ({
      codice_attivita_id: typeof codice_attivita_id === "string" ? codice_attivita_id : "",
      principale: checkboxToBool(atecoPrincipale[i]),
      data_inizio: textOrNull(atecoInizio[i]),
      data_fine: textOrNull(atecoFine[i]),
    }))
    .filter((c) => c.codice_attivita_id !== "");

  const contattoTipo = formData.getAll("contatto_tipo");
  const contattoValore = formData.getAll("contatto_valore");
  const contattoDescrizione = formData.getAll("contatto_descrizione");
  const contattoPrincipale = formData.getAll("contatto_principale");
  const contatti = contattoTipo
    .map((tipo_contatto, i) => ({
      tipo_contatto: typeof tipo_contatto === "string" ? tipo_contatto.trim() : "",
      valore: typeof contattoValore[i] === "string" ? (contattoValore[i] as string).trim() : "",
      descrizione: textOrNull(contattoDescrizione[i]),
      principale: checkboxToBool(contattoPrincipale[i]),
    }))
    .filter((c) => c.tipo_contatto !== "" && c.valore !== "");

  return {
    numero_unita_locale: textOrNull(formData.get("numero_unita_locale")),
    denominazione_sede: textOrNull(formData.get("denominazione_sede")),
    data_apertura: textOrNull(formData.get("data_apertura")),
    data_chiusura: textOrNull(formData.get("data_chiusura")),
    toponimo: textOrNull(formData.get("toponimo")),
    indirizzo: textOrNull(formData.get("indirizzo")),
    numero_civico: textOrNull(formData.get("numero_civico")),
    cap: textOrNull(formData.get("cap")),
    comune: textOrNull(formData.get("comune")),
    provincia: textOrNull(formData.get("provincia")),
    frazione: textOrNull(formData.get("frazione")),
    nazione: textOrNull(formData.get("nazione")),
    stato_unita_id: textOrNull(formData.get("stato_unita_id")),
    note: textOrNull(formData.get("note")),
    tipologia_ids: formData.getAll("tipologia_id").filter((v): v is string => typeof v === "string" && v !== ""),
    attivita,
    codici_ateco,
    contatti,
  };
}

export async function creaUnitaLocale(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<UnitaLocaleDetail>(PATH, { method: "POST", body: JSON.stringify(payloadUnitaLocale(formData)) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function aggiornaUnitaLocale(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<UnitaLocaleDetail>(`${PATH}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadUnitaLocale(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function eliminaUnitaLocale(id: string): Promise<void> {
  await apiFetch<void>(`${PATH}/${id}`, { method: "DELETE" });
  revalidatePath(REVALIDATE_PATH);
}
