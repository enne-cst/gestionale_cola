"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Conoscenza } from "@/lib/types/personale-hr";

import { aggiornaConoscenza, creaConoscenza } from "./actions";

/** "Aggiungi conoscenza"/"Modifica conoscenza" (§8.3): collegata
 * esclusivamente alla persona e all'azienda correnti, mai al mansionario,
 * al ruolo, alla mansione o a un profilo generale. */
export function ConoscenzaDialog({
  trigger,
  personaId,
  conoscenza,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  /** Presente solo in modifica. */
  conoscenza?: Conoscenza;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(conoscenza?.nome ?? "");
  const [descrizione, setDescrizione] = useState(conoscenza?.descrizione ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setNome(conoscenza?.nome ?? "");
      setDescrizione(conoscenza?.descrizione ?? "");
      setErrore(null);
    }
  }

  async function onSubmit() {
    if (!nome.trim()) {
      setErrore("Il nome della conoscenza è obbligatorio.");
      return;
    }
    setSalvando(true);
    setErrore(null);
    const payload = { nome: nome.trim(), descrizione: descrizione.trim() || null };
    const risultato = conoscenza
      ? await aggiornaConoscenza(conoscenza.id, payload)
      : await creaConoscenza(personaId, payload);
    setSalvando(false);
    if (risultato.ok) {
      setOpen(false);
      onSaved();
    } else {
      setErrore(typeof risultato.detail === "string" ? risultato.detail : "Dati non validi.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{conoscenza ? "Modifica conoscenza" : "Aggiungi conoscenza"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cn-nome">Nome della conoscenza</Label>
            <Input id="cn-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cn-descrizione">Descrizione</Label>
            <Textarea id="cn-descrizione" value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={salvando}>
              Annulla
            </Button>
            <Button type="button" onClick={onSubmit} disabled={salvando}>
              {salvando ? "Salvataggio…" : "Salva"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
