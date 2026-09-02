"use server";

import { apiFetch, apiFetchResult } from "@/lib/api";
import type {
  CronologiaEvento,
  CronologiaEventoDettaglio,
  IndicatoriAggiornamentoImpresa,
} from "@/lib/types/anagrafica";

const PATH = "/api/anagrafica/aggiornamento-impresa";

/** § punto 1/2: indicatori sempre calcolati dal backend. */
export async function getIndicatoriAggiornamentoImpresa(): Promise<IndicatoriAggiornamentoImpresa> {
  return apiFetch<IndicatoriAggiornamentoImpresa>(`${PATH}/indicatori`);
}

/** § punto 7/8: cronologia completa, già ordinata dal più recente. */
export async function getCronologiaAggiornamentoImpresa(): Promise<CronologiaEvento[]> {
  return apiFetch<CronologiaEvento[]>(`${PATH}/cronologia`);
}

/** § punto 9: dettaglio di sola lettura di un evento. */
export async function getEventoAggiornamentoImpresa(eventoId: string): Promise<CronologiaEventoDettaglio> {
  return apiFetch<CronologiaEventoDettaglio>(`${PATH}/cronologia/${eventoId}`);
}

export type EsitoVerificaEventoAggiornamentoImpresa =
  | { esito: "ok"; evento: CronologiaEventoDettaglio }
  | { esito: "conflitto" }
  | { esito: "errore"; messaggio: string };

function messaggioGenerico(detail: unknown): string {
  return typeof detail === "string" ? detail : "Errore imprevisto. Riprova.";
}

export async function inviaVerificaEventoAggiornamentoImpresa(
  eventoId: string,
  decision: "VERIFIED" | "REVISION_REQUIRED",
  note: string | null,
  expectedFieldVersion: number | null,
): Promise<EsitoVerificaEventoAggiornamentoImpresa> {
  const result = await apiFetchResult<CronologiaEventoDettaglio>(`${PATH}/cronologia/${eventoId}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, note, expectedFieldVersion }),
  });
  if (result.ok) return { esito: "ok", evento: result.data };
  if (result.status === 409) return { esito: "conflitto" };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}
