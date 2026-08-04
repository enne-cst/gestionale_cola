import type { PanoramicaVoce } from "@/lib/types/panoramica";

/** Elenco dei nomi campo già fissati in Panoramica per una singola sezione
 * singleton, comodo da passare così com'è ai form come elenco di stringhe. */
export function campiFissati(voci: PanoramicaVoce[], sezioneSlug: string): string[] {
  return voci.filter((v) => v.sezione_slug === sezioneSlug && v.campo).map((v) => v.campo as string);
}

/** Elenco degli id record già fissati in Panoramica per una singola sezione
 * a elenco, comodo da passare così com'è alle tabelle come elenco di
 * stringhe. */
export function recordIdsFissati(voci: PanoramicaVoce[], sezioneSlug: string): string[] {
  return voci.filter((v) => v.sezione_slug === sezioneSlug && v.record_id).map((v) => v.record_id as string);
}
