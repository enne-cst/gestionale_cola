"use server";

import { ApiError, apiFetch, apiFetchResult } from "@/lib/api";
import type {
  AnaPersona,
  CaratteristicaRuolo,
  Incarico,
  IncaricoPayload,
  PersonaCreatePayload,
  RuoloSummary,
} from "@/lib/types/personale";

export async function getPersone(): Promise<AnaPersona[]> {
  return apiFetch<AnaPersona[]>("/api/personale/persone");
}

export async function creaPersona(payload: PersonaCreatePayload): Promise<AnaPersona> {
  return apiFetch<AnaPersona>("/api/personale/persone", { method: "POST", body: JSON.stringify(payload) });
}

export async function getRuoli(codici: string[]): Promise<RuoloSummary[]> {
  return apiFetch<RuoloSummary[]>(`/api/personale/ruoli?codici=${encodeURIComponent(codici.join(","))}`);
}

export async function getCaratteristicheRuolo(ruoloId: string): Promise<CaratteristicaRuolo[]> {
  return apiFetch<CaratteristicaRuolo[]>(`/api/personale/ruoli/${ruoloId}/caratteristiche`);
}

export async function getIncarichi(ruoloCodice?: string): Promise<Incarico[]> {
  const query = ruoloCodice ? `?ruolo_codice=${encodeURIComponent(ruoloCodice)}` : "";
  return apiFetch<Incarico[]>(`/api/personale/incarichi${query}`);
}

export type EsitoIncarico = { esito: "ok"; incarico: Incarico } | { esito: "errore"; messaggio: string };

function messaggioGenerico(detail: unknown): string {
  return typeof detail === "string" ? detail : "Errore imprevisto. Riprova.";
}

export async function creaIncarico(payload: IncaricoPayload): Promise<EsitoIncarico> {
  const result = await apiFetchResult<Incarico>("/api/personale/incarichi", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.ok) return { esito: "ok", incarico: result.data };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}

export async function aggiornaIncarico(id: string, payload: Partial<IncaricoPayload>): Promise<EsitoIncarico> {
  const result = await apiFetchResult<Incarico>(`/api/personale/incarichi/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (result.ok) return { esito: "ok", incarico: result.data };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}

export async function eliminaIncarico(id: string): Promise<{ esito: "ok" } | { esito: "errore"; messaggio: string }> {
  try {
    await apiFetch<void>(`/api/personale/incarichi/${id}`, { method: "DELETE" });
    return { esito: "ok" };
  } catch (error) {
    return { esito: "errore", messaggio: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
}

export type EsitoVerificaIncarico =
  | { esito: "ok"; incarico: Incarico }
  | { esito: "conflitto" }
  | { esito: "errore"; messaggio: string };

export async function inviaVerificaIncarico(
  id: string,
  decision: "VERIFIED" | "REVISION_REQUIRED",
  note: string | null,
  expectedFieldVersion: number | null,
): Promise<EsitoVerificaIncarico> {
  const result = await apiFetchResult<Incarico>(`/api/personale/incarichi/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, note, expectedFieldVersion }),
  });
  if (result.ok) return { esito: "ok", incarico: result.data };
  if (result.status === 409) return { esito: "conflitto" };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}
