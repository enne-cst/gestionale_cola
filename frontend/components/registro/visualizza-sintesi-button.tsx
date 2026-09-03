"use client";

import { FileTextIcon } from "lucide-react";

import { useWorkspace } from "@/components/registro/workspace-provider";

/** Pulsante "Visualizza sintesi" del banner "Dati CCIAA" (§ Correzione 25):
 * apre il pannello di sola consultazione della sintesi camerale, senza
 * toccare la sezione CCIAA eventualmente già selezionata (vedi
 * `openSintesi` in workspace-provider.tsx, stato interamente separato).
 * Non è una card della griglia: nessun numero di sezione, nessun
 * contributo al conteggio "N di N sezioni completate". Resta visibile sia
 * a elenco aperto sia compresso perché vive nell'header del banner, non
 * dentro la griglia collassabile. Il testo si nasconde sotto ~500px del
 * contenitore (§ prototipo "il testo può essere nascosto su mobile
 * mantenendo icona e nome accessibile"): container query per restare
 * coerente con il resto del banner, che reflowisce sulla propria
 * larghezza e non su quella del viewport. */
export function VisualizzaSintesiButton() {
  const { openSintesi } = useWorkspace();

  return (
    <button
      type="button"
      onClick={openSintesi}
      aria-label="Visualizza sintesi"
      className="inline-flex min-h-[38px] items-center gap-2 rounded-[7px] border border-[#ccd9f1] bg-white px-[15px] text-[11px] font-bold text-[var(--az-blue)] hover:bg-[#f7faff]"
    >
      <FileTextIcon className="size-[17px] shrink-0" />
      <span className="hidden @sm:inline">Visualizza sintesi</span>
    </button>
  );
}
