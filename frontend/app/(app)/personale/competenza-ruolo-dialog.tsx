"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { aggiornaCompetenzaRuolo, creaCompetenzaRuolo } from "./actions";
import type { CompetenzaRuolo } from "@/lib/types/personale-hr";

/** Form unico "Aggiungi competenza"/"Modifica competenza" (§6-§9 della
 * correzione "Mansionario e profilo standard delle competenze del ruolo"):
 * solo nome e descrizione, nessun livello/valutazione/macroarea — quella
 * distinzione resta un dettaglio tecnico interno, mai esposto qui. */
export function CompetenzaRuoloDialog({
  trigger,
  ruoloId,
  competenza,
  onSaved,
}: {
  trigger: ReactNode;
  ruoloId: string;
  /** Presente solo in modifica. */
  competenza?: CompetenzaRuolo;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(competenza?.nome ?? "");
  const [descrizione, setDescrizione] = useState(competenza?.descrizione ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setNome(competenza?.nome ?? "");
      setDescrizione(competenza?.descrizione ?? "");
      setErrore(null);
    }
  }

  async function onSubmit() {
    if (!nome.trim()) {
      setErrore("Il nome della competenza è obbligatorio.");
      return;
    }
    setSalvando(true);
    setErrore(null);
    const payload = { nome: nome.trim(), descrizione: descrizione || null };
    const risultato = competenza
      ? await aggiornaCompetenzaRuolo(competenza.id, payload)
      : await creaCompetenzaRuolo(ruoloId, payload);
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
          <DialogTitle>{competenza ? "Modifica competenza" : "Aggiungi competenza"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="competenza-nome">Nome della competenza</Label>
            <Input id="competenza-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="competenza-descrizione">Descrizione</Label>
            <Textarea id="competenza-descrizione" value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={salvando}>
              Annulla
            </Button>
            <Button type="button" onClick={onSubmit} disabled={salvando}>
              {salvando ? "Salvataggio…" : "Salva"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
