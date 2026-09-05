"use server";

import { apiFetch } from "@/lib/api";
import type { PanoramicaVoce } from "@/lib/types/panoramica";

export async function getVociPanoramica(modulo: string): Promise<PanoramicaVoce[]> {
  return apiFetch<PanoramicaVoce[]>(`/api/panoramica?modulo=${encodeURIComponent(modulo)}`);
}

export async function pinVocePanoramica(
  modulo: string,
  sezioneSlug: string,
  campo: string,
  etichetta: string,
): Promise<PanoramicaVoce> {
  return apiFetch<PanoramicaVoce>("/api/panoramica", {
    method: "POST",
    body: JSON.stringify({ modulo, sezione_slug: sezioneSlug, campo, etichetta }),
  });
}

export async function unpinVocePanoramica(modulo: string, sezioneSlug: string, campo: string): Promise<void> {
  const params = new URLSearchParams({ modulo, sezione_slug: sezioneSlug, campo });
  await apiFetch<void>(`/api/panoramica?${params.toString()}`, { method: "DELETE" });
}

/** Variante di pinVocePanoramica per un intero record di una sezione a
 * elenco (una sede, un contatto...), invece che per un campo di una
 * sezione singleton. */
export async function pinRecordPanoramica(
  modulo: string,
  sezioneSlug: string,
  recordId: string,
  etichetta: string,
): Promise<PanoramicaVoce> {
  return apiFetch<PanoramicaVoce>("/api/panoramica", {
    method: "POST",
    body: JSON.stringify({ modulo, sezione_slug: sezioneSlug, record_id: recordId, etichetta }),
  });
}

export async function unpinRecordPanoramica(modulo: string, sezioneSlug: string, recordId: string): Promise<void> {
  const params = new URLSearchParams({ modulo, sezione_slug: sezioneSlug, record_id: recordId });
  await apiFetch<void>(`/api/panoramica?${params.toString()}`, { method: "DELETE" });
}

/** Salva il nuovo ordine di visualizzazione delle voci in Panoramica: la
 * posizione di ciascun id nell'elenco diventa il suo nuovo `ordine`. */
export async function riordinaPanoramica(modulo: string, ids: string[]): Promise<void> {
  await apiFetch<void>("/api/panoramica/ordine", {
    method: "PUT",
    body: JSON.stringify({ modulo, ids }),
  });
}
