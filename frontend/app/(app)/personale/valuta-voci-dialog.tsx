"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LivelloValutazione } from "@/lib/types/personale-hr";

import { valutaCompetenze, valutaConoscenze } from "./actions";

const LIVELLO_OPZIONI: { value: LivelloValutazione; label: string }[] = [
  { value: "BASE", label: "Base" },
  { value: "INTERMEDIO", label: "Intermedio" },
  { value: "AVANZATO", label: "Avanzato" },
];

export interface VoceDaValutare {
  voce_id: string;
  nome: string;
  livello_attuale: LivelloValutazione | null;
}

/** Sessione di valutazione analitica (§8.5/§9.4): stesso form per una
 * singola voce (il chiamante passa un array con un solo elemento, dal
 * comando "Valuta" della riga) o per più voci insieme ("Valuta
 * conoscenze"/"Valuta competenze"). Ogni voce resta un record distinto
 * (per_valutazioni_personale_dettagli), mai una media. Non tocca mai il
 * macro-indicatore corrispondente. */
export function ValutaVociDialog({
  trigger,
  personaId,
  tipo,
  voci,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  tipo: "conoscenze" | "competenze";
  voci: VoceDaValutare[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [notaGenerale, setNotaGenerale] = useState("");
  const [livelli, setLivelli] = useState<Record<string, LivelloValutazione>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setData(new Date().toISOString().slice(0, 10));
      setNotaGenerale("");
      setLivelli(Object.fromEntries(voci.map((v) => [v.voce_id, v.livello_attuale ?? "BASE"])));
      setNote({});
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
    const payload = {
      data_valutazione: data,
      nota_generale: notaGenerale.trim() || null,
      voci: voci.map((v) => ({
        voce_id: v.voce_id,
        livello: livelli[v.voce_id] ?? "BASE",
        evidenza_nota: note[v.voce_id]?.trim() || null,
      })),
    };
    const risultato = tipo === "conoscenze" ? await valutaConoscenze(personaId, payload) : await valutaCompetenze(personaId, payload);
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{tipo === "conoscenze" ? "Valuta conoscenze" : "Valuta competenze"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vv-data">Data valutazione</Label>
              <Input id="vv-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vv-nota">Nota generale facoltativa</Label>
              <Input id="vv-nota" value={notaGenerale} onChange={(e) => setNotaGenerale(e.target.value)} />
            </div>
          </div>

          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {voci.map((v) => (
              <div key={v.voce_id} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <span className="text-sm font-medium text-foreground">{v.nome}</span>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={livelli[v.voce_id] ?? "BASE"}
                    onValueChange={(val) => setLivelli((prev) => ({ ...prev, [v.voce_id]: val as LivelloValutazione }))}
                  >
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
                  <Input
                    placeholder="Nota facoltativa"
                    value={note[v.voce_id] ?? ""}
                    onChange={(e) => setNote((prev) => ({ ...prev, [v.voce_id]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={salvando}>
              Annulla
            </Button>
            <Button type="button" onClick={onSubmit} disabled={salvando || voci.length === 0}>
              {salvando ? "Salvataggio…" : "Salva valutazione"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
