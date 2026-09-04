"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { eliminaCompetenzaRuolo } from "./actions";
import type { CompetenzaRuolo } from "@/lib/types/personale-hr";

/** Rimozione di una competenza dal mansionario (§10 della correzione): mai
 * una cancellazione fisica della voce di catalogo — disattiva solo la
 * relazione ruolo↔competenza, così la competenza smette di essere
 * richiesta per il ruolo senza intaccare lo storico o altri ruoli. */
export function EliminaCompetenzaDialog({
  trigger,
  competenza,
  onRemoved,
}: {
  trigger: ReactNode;
  competenza: CompetenzaRuolo;
  onRemoved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [rimuovendo, setRimuovendo] = useState(false);

  async function onConferma() {
    setRimuovendo(true);
    setErrore(null);
    const risultato = await eliminaCompetenzaRuolo(competenza.id);
    setRimuovendo(false);
    if (risultato.ok) {
      setOpen(false);
      onRemoved();
    } else {
      setErrore(typeof risultato.detail === "string" ? risultato.detail : "Impossibile rimuovere la competenza.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rimuovi competenza</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Rimuovere "{competenza.nome}" dal mansionario di questo ruolo? Non sarà più richiesta per le future
          valutazioni, ma resta nello storico.
        </p>
        <FormError message={errore ?? undefined} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={rimuovendo}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={onConferma} disabled={rimuovendo}>
            {rimuovendo ? "Rimozione…" : "Rimuovi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
