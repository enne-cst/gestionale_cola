"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { etichettaTipologiaEvento } from "@/lib/aggiornamento-impresa-format";
import type { CronologiaEventoDettaglio } from "@/lib/types/anagrafica";

/** Dettaglio di un evento della cronologia (§9): sola lettura, il form
 * aperto dipende dal tipo di evento (`dati.campi`, già risolto dal
 * backend), mai una modifica dei log tecnici — nessun pulsante "Salva",
 * nessuna action collegata. */
export function EventoDettaglioDialog({
  open,
  dati,
  onOpenChange,
}: {
  open: boolean;
  dati: CronologiaEventoDettaglio | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dati ? etichettaTipologiaEvento(dati.tipologia) : "Dettaglio evento"}</DialogTitle>
        </DialogHeader>
        {dati && (
          <div className="grid gap-3">
            {dati.campi.map((campo) => (
              <div key={campo.label} className="grid gap-1 border-b border-[var(--az-border)] pb-2 last:border-b-0">
                <span className="text-[10px] font-semibold text-[var(--az-muted)]">{campo.label}</span>
                <span className="text-sm text-[var(--az-ink)]">{campo.value ?? "—"}</span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
