"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { aggiornaIncarico } from "@/lib/actions/personale";
import type { PersonaRuolo } from "@/lib/types/personale-hr";

/** Cessazione di un'assegnazione manuale (§11: mai un DELETE). Valorizza
 * "Data di fine" (caratteristica A02) e lo stato dell'incarico a CESSATO
 * sulla riga esistente — il record e i documenti collegati restano
 * consultabili nello storico. */
export function CessaRuoloDialog({ trigger, ruolo, onSaved }: { trigger: ReactNode; ruolo: PersonaRuolo; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [dataFine, setDataFine] = useState(() => new Date().toISOString().slice(0, 10));
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function onConferma() {
    setSalvando(true);
    setErrore(null);
    const esito = await aggiornaIncarico(ruolo.id, { stato: "CESSATO", valori: { A02: dataFine } });
    setSalvando(false);
    if (esito.esito === "ok") {
      setOpen(false);
      onSaved();
    } else {
      setErrore(esito.messaggio);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cessa "{ruolo.ruolo_denominazione}"</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          L'assegnazione resta consultabile nello storico: vengono aggiornati solo la data di fine e lo stato.
        </p>
        <FormError message={errore ?? undefined} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cessa-ruolo-data-fine">Data di fine</Label>
          <Input id="cessa-ruolo-data-fine" type="date" value={dataFine} onChange={(e) => setDataFine(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={salvando}>
            Annulla
          </Button>
          <Button onClick={onConferma} disabled={salvando}>
            {salvando ? "Salvataggio…" : "Conferma cessazione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
