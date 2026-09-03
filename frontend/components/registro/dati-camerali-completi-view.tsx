"use client";

import { XIcon } from "lucide-react";

import { SectionOrCciaaPanel } from "@/components/registro/section-or-cciaa-panel";

// § Correzione 26 §15: stesse 10 card della griglia "Dati CCIAA" (vedi
// `cciaaCards` in `app/(app)/anagrafica/page.tsx`, "sintesi" esclusa per
// definizione — § Correzione 25), impilate una sotto l'altra invece che in
// griglia. Duplicato qui invece di importato da `page.tsx` (Server
// Component, non un modulo condiviso importabile da un Client Component)
// — solo le chiavi, senza i conteggi/stati che quella pagina calcola per
// le card: ogni pannello qui sotto calcola e mostra il proprio stato da
// sé, esattamente come quando si apre singolarmente da una card.
const SEZIONI_DATI_COMPLETI = [
  "sede",
  "statuto",
  "capitale-sociale",
  "soci",
  "amministratori",
  "sindaci",
  "attivita-albi",
  "personale-occupazione",
  "sedi-secondarie",
  "aggiornamento-impresa",
];

/** Pagina "Dati camerali completi" (§15, aperta da "Apri dati camerali
 * completi" nel footer della Sintesi): tutte le sezioni CCIAA, ciascuna
 * con il proprio pannello reale (stesso `SectionOrCciaaPanel` usato da
 * drawer/affiancamento/scheda) — non una vista alternativa con dati
 * propri, solo un modo diverso di montare gli stessi componenti. Ogni
 * sezione carica, mostra la verifica/visibilità e salva esattamente come
 * quando aperta singolarmente da una card della griglia.
 *
 * § Correzione 27: `stackedMode` su ciascun pannello — ripetere il banner
 * legenda + "Modifica dati" dopo ognuna delle 10 sezioni non ha senso qui
 * (richiesta esplicita dell'utente): il pulsante "Modifica" si sposta
 * nell'intestazione di ciascuna sezione (allineato al titolo, sul margine
 * destro) e il banner in lettura sparisce — resta solo quando una sezione
 * è davvero in modifica (Annulla/Salva restano indispensabili lì). */
export function DatiCameraliCompletiView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex min-h-[34rem] flex-col overflow-hidden rounded-[12px] border border-[var(--az-border)] bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-[#edf1f7] px-[30px] py-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--az-ink)]">Dati camerali completi</h2>
          <p className="mt-[9px] text-sm text-[#354a89]">Tutte le sezioni della visura, una di seguito all&apos;altra</p>
        </div>
        <button
          type="button"
          aria-label="Chiudi dati camerali completi"
          onClick={onClose}
          className="grid size-9 shrink-0 place-items-center rounded-[7px] border border-[#cedaf0] text-[var(--az-ink)] hover:bg-[#f6f9ff]"
        >
          <XIcon className="size-[18px]" />
        </button>
      </div>
      <div className="az-scroll-thin flex-1 overflow-y-auto">
        <div className="flex flex-col divide-y divide-[#edf1f7] px-[30px] pb-10">
          {SEZIONI_DATI_COMPLETI.map((sectionKey) => (
            <div key={sectionKey} className="py-8 first:pt-6">
              <SectionOrCciaaPanel sectionKey={sectionKey} stackedMode />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
