"use client";

import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/registro/workspace-provider";

/** Footer della Sintesi camerale (§14/§15 Correzione 26): stessa struttura
 * di `SectionFooter` (stato di modifica o azione), ma la modalità modifica
 * riguarda solo i 4 campi booleani di "ATTIVITA'" (§8.2) e l'azione
 * principale in lettura è "Apri dati camerali completi" invece di
 * "Modifica dati" — "Modifica" per la sintesi vive nell'intestazione (§4),
 * non qui, perché nel prototipo è lì che compare.
 *
 * § Correzione 28 §10/§21: nessuna legenda di verifica qui — la sintesi
 * non mostra più indicatori di stato (verde/rosso/arancione) su nessuna
 * voce, quindi una legenda che li spiegherebbe non avrebbe più senso in
 * questo footer. Gli stati restano intatti nelle sezioni originali, solo
 * la loro rappresentazione qui è stata rimossa. */
export function SintesiFooter() {
  const { state, cancelSintesiEdit, saveSintesiEdit, openDatiCompleti } = useWorkspace();
  const { editing, draft, saving } = state.sintesi;
  const dirty = Object.keys(draft).length > 0;

  if (editing) {
    return (
      <div className="shrink-0 border-t border-[var(--az-border)] bg-[#fffffffa] px-[30px] py-0 shadow-[0_-7px_22px_rgba(31,50,94,0.04)]">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          <span className="inline-flex items-center gap-[7px] text-xs font-bold text-[#617395]">
            {dirty ? "Modifiche non salvate" : "Seleziona Sì o No nei campi modificabili"}
          </span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-w-[126px] rounded-[7px] border-[var(--az-blue)] text-[var(--az-blue)] hover:bg-[#f5f8ff]"
              onClick={cancelSintesiEdit}
              disabled={saving}
            >
              Annulla
            </Button>
            <Button
              type="button"
              className="h-11 min-w-[126px] rounded-[7px] bg-[var(--az-blue)] hover:bg-[var(--az-blue-dark)]"
              onClick={() => saveSintesiEdit()}
              disabled={saving || !dirty}
            >
              {saving ? "Salvataggio…" : "Salva modifiche"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-[var(--az-border)] bg-[#fffffffa] px-[30px] py-0 shadow-[0_-7px_22px_rgba(31,50,94,0.04)]">
      <div className="flex min-h-[72px] items-center">
        <Button
          type="button"
          className="h-11 min-w-[206px] rounded-[7px] bg-[var(--az-blue)] text-[13px] font-bold shadow-[0_5px_12px_rgba(7,94,255,0.18)] hover:bg-[var(--az-blue-dark)]"
          onClick={openDatiCompleti}
        >
          Apri dati camerali completi
        </Button>
      </div>
    </div>
  );
}
