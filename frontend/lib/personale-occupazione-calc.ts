// Ricalcolo lato client dei "numeri di persone" derivati da un gruppo di
// percentuali esaustive (Correzione 22, § punto 22: "il frontend deve
// ripetere il calcolo per fornire un aggiornamento immediato durante la
// modifica, ma il backend deve rimanere la fonte definitiva del risultato").
// Stessa logica — metodo dei maggiori resti, stessa tolleranza — di
// `backend/app/core/personale_occupazione.py::_gruppo_calcolato`: se le due
// implementazioni divergono è un bug da correggere qui, non un'altra fonte
// di verità.

const TOLLERANZA_SOMMA_PERCENTUALI = 1;

function maggioriResti(percentuali: number[], totale: number): number[] {
  const quote = percentuali.map((p) => (p * totale) / 100);
  const interi = quote.map((q) => Math.trunc(q));
  const scarti = quote.map((q, i) => q - interi[i]);
  let resto = totale - interi.reduce((a, b) => a + b, 0);

  if (resto > 0) {
    const ordine = scarti.map((s, i) => i).sort((a, b) => scarti[b] - scarti[a]);
    for (const i of ordine.slice(0, resto)) interi[i] += 1;
  } else if (resto < 0) {
    const ordine = scarti.map((s, i) => i).sort((a, b) => scarti[a] - scarti[b]);
    for (const i of ordine.slice(0, -resto)) interi[i] -= 1;
  }
  return interi;
}

export type GruppoCalcolatoPreview = {
  coerente: boolean;
  numeri: (number | null)[];
};

/** `percentuali` nello stesso ordine delle categorie del gruppo (es.
 * [tempoDeterminato, tempoIndeterminato]); `null`/`undefined`/stringa vuota
 * per un valore non ancora inserito. Ritorna `numeri` tutti `null` quando il
 * gruppo non è completo o le percentuali non sommano (con tolleranza) a
 * 100 — mai un numero presentato come certo in quei casi (§ punto 14). */
export function calcolaGruppo(
  percentuali: (number | string | null | undefined)[],
  dipendenti: number | string | null | undefined,
): GruppoCalcolatoPreview {
  const dip = dipendenti === null || dipendenti === undefined || dipendenti === "" ? null : Number(dipendenti);
  const valori = percentuali.map((p) => (p === null || p === undefined || p === "" ? null : Number(p)));

  if (dip === null || Number.isNaN(dip) || dip < 0 || valori.some((v) => v === null || Number.isNaN(v))) {
    return { coerente: false, numeri: percentuali.map(() => null) };
  }

  const somma = (valori as number[]).reduce((a, b) => a + b, 0);
  if (Math.abs(somma - 100) > TOLLERANZA_SOMMA_PERCENTUALI) {
    return { coerente: false, numeri: percentuali.map(() => null) };
  }

  return { coerente: true, numeri: maggioriResti(valori as number[], dip) };
}
