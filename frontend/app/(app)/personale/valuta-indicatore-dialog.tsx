"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LivelloValutazione, MacroareaCompetenze } from "@/lib/types/personale-hr";

import { valutaMacroIndicatore } from "./actions";

const MACROAREA_LABEL: Record<MacroareaCompetenze, string> = {
  KNOWLEDGE: "Conoscenza",
  COMPETENCE: "Competenza",
  AWARENESS: "Consapevolezza",
};

const LIVELLO_OPZIONI: { value: LivelloValutazione; label: string }[] = [
  { value: "BASE", label: "Base" },
  { value: "INTERMEDIO", label: "Intermedio" },
  { value: "AVANZATO", label: "Avanzato" },
];

/** Modale unica "Valuta indicatore" (§6), riutilizzata per i tre
 * macro-indicatori: salva esclusivamente il macro-indicatore selezionato
 * (una nuova riga in per_valutazioni_personale con solo la testata
 * valorizzata, nessun dettaglio collegato) — mai una modifica di
 * conoscenze, competenze o voci nascoste. Il valutatore è sempre l'utente
 * autenticato: nessun selettore di utenti azienda esiste in piattaforma. */
export function ValutaIndicatoreDialog({
  trigger,
  personaId,
  macroarea,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  macroarea: MacroareaCompetenze;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [livello, setLivello] = useState<LivelloValutazione>("BASE");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setLivello("BASE");
      setData(new Date().toISOString().slice(0, 10));
      setNota("");
      setErrore(null);
    }
  }

  async function onSubmit() {
    if (!data) {
      setErrore("La data della valutazione è obbligatoria.");
      return;
    }
    setSalvando(true);
    setErrore(null);
    const risultato = await valutaMacroIndicatore(personaId, macroarea, {
      livello,
      data_valutazione: data,
      nota: nota.trim() || null,
    });
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
          <DialogTitle>Valuta indicatore</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label>Indicatore</Label>
            <Input value={MACROAREA_LABEL[macroarea]} disabled readOnly />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Livello complessivo</Label>
              <Select value={livello} onValueChange={(v) => setLivello(v as LivelloValutazione)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIVELLO_OPZIONI.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vi-data">Data della valutazione</Label>
              <Input id="vi-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vi-nota">Nota facoltativa</Label>
            <Textarea id="vi-nota" value={nota} onChange={(e) => setNota(e.target.value)} />
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
