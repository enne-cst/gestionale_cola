"use client";

import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VerificationLegend } from "@/components/registro/field-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { cn } from "@/lib/utils";

/** Banner di modifica + legenda di una sezione a registro (§8.2/§9 del
 * prompt master): stato di modifica (Annulla/Salva) o vista (legenda +
 * "Modifica dati"), sempre in fondo alla pagina della sezione — dopo i
 * campi e dopo eventuali tabelle annidate (Soci/Amministratori/Sindaci),
 * mai tra i campi e la tabella. Estratto da `SectionContent` (che lo usa
 * per le sezioni "pure" senza tabella, con `hideFooter` non impostato) per
 * poterlo posizionare anche fuori da un blocco embedded, come sibling dopo
 * la tabella, in `CciaaSectionPanel`. */
export function SectionFooter({
  sectionKey,
  embedded = false,
}: {
  sectionKey: string;
  // true solo quando il footer resta annidato nello stesso blocco embedded
  // dei campi (nessun caso attuale lo fa più: le card composite con
  // tabella lo montano come sibling dopo la tabella, stile "a tutta
  // larghezza" come nelle sezioni pure). Tenuto per compatibilità del
  // componente, non per uso corrente.
  embedded?: boolean;
}) {
  const { state, enterEdit, requestDiscard, save } = useWorkspace();
  const entry = state.sections[sectionKey];
  if (!entry?.server) return null;

  const modificando = entry.editing;

  async function onSalva() {
    await save(sectionKey);
  }

  return (
    <div
      className={cn(
        "shrink-0 border-t border-[var(--az-border)] py-0",
        embedded ? "mt-2" : "bg-[#fffffffa] px-[30px] shadow-[0_-7px_22px_rgba(31,50,94,0.04)]",
      )}
    >
      {modificando ? (
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          <span className="text-xs text-[var(--az-muted)]">
            {Object.keys(entry.fieldErrors).length > 0 ? "Modifica i campi evidenziati" : ""}
          </span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-w-[126px] rounded-[7px] border-[var(--az-blue)] text-[var(--az-blue)] hover:bg-[#f5f8ff]"
              onClick={() => requestDiscard(sectionKey)}
              disabled={entry.saving}
            >
              Annulla
            </Button>
            <Button
              type="button"
              className="h-11 min-w-[126px] rounded-[7px] bg-[var(--az-blue)] hover:bg-[var(--az-blue-dark)]"
              onClick={onSalva}
              disabled={entry.saving || Object.keys(entry.fieldErrors).length > 0}
            >
              {entry.saving ? "Salvataggio…" : "Salva modifiche"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 py-4">
          <VerificationLegend />
          <div className="flex items-center gap-4">
            <Button
              type="button"
              className="h-11 w-[168px] rounded-[7px] bg-[var(--az-blue)] text-[13px] font-bold shadow-[0_5px_12px_rgba(7,94,255,0.18)] hover:bg-[var(--az-blue-dark)]"
              onClick={() => enterEdit(sectionKey)}
            >
              <PencilIcon className="size-4" />
              Modifica dati
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
