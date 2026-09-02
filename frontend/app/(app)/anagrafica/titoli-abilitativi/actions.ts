"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, apiFetchResult, checkboxToBool, textOrNull } from "@/lib/api";
import type { CatalogoVoce } from "@/lib/types/anagrafica-iso9001";
import type { AnaPersona } from "@/lib/types/personale";
import type {
  Sede,
  SettoreIafVoce,
  TitoloAbilitativoAlbo,
  TitoloAbilitativoCertificazione,
  TitoloAbilitativoDetail,
  TitoloAbilitativoLicenza,
  TitoloAbilitativoRuolo,
  TitoloAbilitativoSummary,
} from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

const PATH = "/api/anagrafica/titoli-abilitativi";
const REVALIDATE_PATH = "/anagrafica";

function campiComuniDaFormData(formData: FormData) {
  return {
    numero_attestazione: textOrNull(formData.get("numero_attestazione")),
    ente_rilascio: textOrNull(formData.get("ente_rilascio")),
    data_rilascio: textOrNull(formData.get("data_rilascio")),
    data_scadenza: checkboxToBool(formData.get("senza_scadenza")) ? null : textOrNull(formData.get("data_scadenza")),
    senza_scadenza: checkboxToBool(formData.get("senza_scadenza")),
    note: textOrNull(formData.get("note")),
    stato_titolo_id: textOrNull(formData.get("stato_titolo_id")),
  };
}

/** Vista riepilogativa per la tabella unificata (§ punto 3/4). */
export async function getTitoliAbilitativi(): Promise<TitoloAbilitativoSummary[]> {
  return apiFetch<TitoloAbilitativoSummary[]>(PATH);
}

/** Lettura del dettaglio tipizzato per l'apertura del form corretto
 * (§ punto 8: "selezionando una riga la piattaforma riconosce la tipologia
 * e apre il form corrispondente") — le informazioni non comprese nella
 * tabella riepilogativa vivono solo qui (§ punto 8, ultimo comma). */
export async function getTitoloAbilitativo(id: string): Promise<TitoloAbilitativoDetail> {
  return apiFetch<TitoloAbilitativoDetail>(`${PATH}/${id}`);
}

export async function eliminaTitoloAbilitativo(id: string): Promise<void> {
  await apiFetch<void>(`${PATH}/${id}`, { method: "DELETE" });
  revalidatePath(REVALIDATE_PATH);
}

export type EsitoVerificaTitolo =
  | { esito: "ok"; titolo: TitoloAbilitativoDetail }
  | { esito: "conflitto" }
  | { esito: "errore"; messaggio: string };

function messaggioGenerico(detail: unknown): string {
  return typeof detail === "string" ? detail : "Errore imprevisto. Riprova.";
}

export async function inviaVerificaTitoloAbilitativo(
  id: string,
  decision: "VERIFIED" | "REVISION_REQUIRED",
  note: string | null,
  expectedFieldVersion: number | null,
): Promise<EsitoVerificaTitolo> {
  const result = await apiFetchResult<TitoloAbilitativoDetail>(`${PATH}/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, note, expectedFieldVersion }),
  });
  if (result.ok) return { esito: "ok", titolo: result.data };
  if (result.status === 409) return { esito: "conflitto" };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}

// ---------------------------------------------------------------------------
// Cataloghi (§ Correzione 21) — caricati lato client dai form, stesso
// pattern di `getPersone`/`getCaratteristicheRuolo` in lib/actions/personale.ts.
// ---------------------------------------------------------------------------

export type NomeCatalogoTitoloAbilitativo =
  | "stati-titolo"
  | "tipologie-albo"
  | "tipologie-ruolo"
  | "tipologie-licenza"
  | "tipologie-certificazione-attestazione"
  | "norme-certificazione"
  | "categorie-soa"
  | "classifiche-soa";

export async function getCatalogoTitoloAbilitativo(nome: NomeCatalogoTitoloAbilitativo): Promise<CatalogoVoce[]> {
  return apiFetch<CatalogoVoce[]>(`${PATH}/cataloghi/${nome}`);
}

export async function getSettoriIaf(): Promise<SettoreIafVoce[]> {
  return apiFetch<SettoreIafVoce[]>(`${PATH}/cataloghi/settori-iaf`);
}

export async function getPersoneTitoliAbilitativi(): Promise<AnaPersona[]> {
  return apiFetch<AnaPersona[]>("/api/personale/persone");
}

export async function getSediTitoliAbilitativi(): Promise<Sede[]> {
  return apiFetch<Sede[]>("/api/anagrafica/sedi");
}

// ---------------------------------------------------------------------------
// Form Albo
// ---------------------------------------------------------------------------

function payloadAlbo(formData: FormData) {
  return {
    ...campiComuniDaFormData(formData),
    tipologia_albo_id: textOrNull(formData.get("tipologia_albo_id")),
    categoria: textOrNull(formData.get("categoria")),
    denominazione_albo: textOrNull(formData.get("denominazione_albo")),
    sezione: textOrNull(formData.get("sezione")),
    persona_id: textOrNull(formData.get("persona_id")),
    provincia_ambito: textOrNull(formData.get("provincia_ambito")),
    attivita_abilitazioni: textOrNull(formData.get("attivita_abilitazioni")),
  };
}

export async function creaAlbo(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoAlbo>(`${PATH}/albo`, { method: "POST", body: JSON.stringify(payloadAlbo(formData)) });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function aggiornaAlbo(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoAlbo>(`${PATH}/albo/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadAlbo(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Form Ruolo
// ---------------------------------------------------------------------------

function payloadRuolo(formData: FormData) {
  return {
    ...campiComuniDaFormData(formData),
    tipologia_ruolo_id: textOrNull(formData.get("tipologia_ruolo_id")),
    denominazione_ruolo: textOrNull(formData.get("denominazione_ruolo")),
    sezione_categoria: textOrNull(formData.get("sezione_categoria")),
    persona_id: textOrNull(formData.get("persona_id")),
    provincia_ambito: textOrNull(formData.get("provincia_ambito")),
    attivita_abilitate: textOrNull(formData.get("attivita_abilitate")),
  };
}

export async function creaRuolo(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoRuolo>(`${PATH}/ruolo`, {
      method: "POST",
      body: JSON.stringify(payloadRuolo(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function aggiornaRuolo(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoRuolo>(`${PATH}/ruolo/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadRuolo(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Form Licenza
// ---------------------------------------------------------------------------

function payloadLicenza(formData: FormData) {
  return {
    ...campiComuniDaFormData(formData),
    tipologia_licenza_id: textOrNull(formData.get("tipologia_licenza_id")),
    denominazione_licenza: textOrNull(formData.get("denominazione_licenza")),
    oggetto_attivita: textOrNull(formData.get("oggetto_attivita")),
    persona_id: textOrNull(formData.get("persona_id")),
    sede_id: textOrNull(formData.get("sede_id")),
    ambito_territoriale: textOrNull(formData.get("ambito_territoriale")),
    data_efficacia: textOrNull(formData.get("data_efficacia")),
    condizioni_prescrizioni: textOrNull(formData.get("condizioni_prescrizioni")),
    estremi_rinnovo: textOrNull(formData.get("estremi_rinnovo")),
  };
}

export async function creaLicenza(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoLicenza>(`${PATH}/licenza`, {
      method: "POST",
      body: JSON.stringify(payloadLicenza(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function aggiornaLicenza(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoLicenza>(`${PATH}/licenza/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadLicenza(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Form Certificazione o attestazione
// ---------------------------------------------------------------------------

function payloadCertificazione(formData: FormData) {
  const categorieSoaId = formData.getAll("soa_categoria_id");
  const categorieClassificaId = formData.getAll("soa_classifica_id");
  const categorie_soa = categorieSoaId
    .map((categoria_soa_id, i) => ({
      categoria_soa_id: typeof categoria_soa_id === "string" ? categoria_soa_id : "",
      classifica_soa_id: textOrNull(categorieClassificaId[i]),
    }))
    .filter((c) => c.categoria_soa_id !== "");

  return {
    ...campiComuniDaFormData(formData),
    sotto_tipo_id: formData.get("sotto_tipo_id") as string,
    norma_id: textOrNull(formData.get("norma_id")),
    edizione_anno: textOrNull(formData.get("edizione_anno")),
    organismo_accreditamento: textOrNull(formData.get("organismo_accreditamento")),
    campo_applicazione: textOrNull(formData.get("campo_applicazione")),
    data_prima_emissione: textOrNull(formData.get("data_prima_emissione")),
    settori_iaf_ids: formData.getAll("settore_iaf_id").filter((v): v is string => typeof v === "string" && v !== ""),
    categorie_soa,
    denominazione: textOrNull(formData.get("denominazione")),
    schema_norma: textOrNull(formData.get("schema_norma")),
  };
}

export async function creaCertificazione(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoCertificazione>(`${PATH}/certificazione`, {
      method: "POST",
      body: JSON.stringify(payloadCertificazione(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function aggiornaCertificazione(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoCertificazione>(`${PATH}/certificazione/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadCertificazione(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}
