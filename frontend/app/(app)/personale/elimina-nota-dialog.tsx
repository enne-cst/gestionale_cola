"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";

import { eliminaNota } from "./actions";

/** Eliminazione di una nota (§12): richiede conferma, cancellazione
 * logica (archived_at), mai fisica. */
export function EliminaNotaDialog({ trigger, notaId, onDeleted }: { trigger: ReactNode; notaId: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  async function onConferma() {
    setEliminando(true);
    setErrore(null);
    const risultato = await eliminaNota(notaId);
    setEliminando(false);
    if (risultato.ok) {
      setOpen(false);
      onDeleted();
    } else {
      setErrore(typeof risultato.detail === "string" ? risultato.detail : "Impossibile eliminare la nota.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Elimina nota</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Eliminare questa nota? L&apos;operazione non è visibile nel resto della piattaforma.</p>
        <FormError message={errore ?? undefined} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={eliminando}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={onConferma} disabled={eliminando}>
            {eliminando ? "Eliminazione…" : "Elimina"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
