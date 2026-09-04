"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { eliminaDocumentoPersona } from "./actions";
import type { DocumentoPersonale } from "@/lib/types/personale-hr";

/** Conferma di rimozione di un documento personale (§8 della correzione):
 * nessun collegamento reale con altri moduli oggi (nessun sistema
 * documentale wired), quindi la rimozione elimina solo la riga di
 * metadati — nessun allegato reale da orfanizzare. */
export function EliminaDocumentoDialog({ trigger, documento, onDeleted }: { trigger: ReactNode; documento: DocumentoPersonale; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  async function onConferma() {
    setEliminando(true);
    setErrore(null);
    const risultato = await eliminaDocumentoPersona(documento.id);
    setEliminando(false);
    if (risultato.ok) {
      setOpen(false);
      onDeleted();
    } else {
      setErrore(typeof risultato.detail === "string" ? risultato.detail : "Impossibile rimuovere il documento.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rimuovi documento</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Rimuovere "{documento.tipo_documento.denominazione}"{documento.numero ? ` (${documento.numero})` : ""}? L'operazione non
          può essere annullata.
        </p>
        <FormError message={errore ?? undefined} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={eliminando}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={onConferma} disabled={eliminando}>
            {eliminando ? "Rimozione…" : "Rimuovi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
