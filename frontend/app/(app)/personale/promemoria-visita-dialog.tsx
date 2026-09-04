"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { creaPromemoriaVisita } from "./actions";

const DESTINATARI_OPZIONI = ["Solo autore", "Consulenti", "Azienda e consulenti"];

/** "Promemoria" (§15): può essere creato anche prima di pianificare
 * l'appuntamento, per ricordare di fissarlo. Non crea né modifica un
 * appuntamento o un giudizio, non alimenta l'indicatore "Prossima visita" —
 * un record indipendente nello Scadenziario (per_attivita). */
export function PromemoriaVisitaDialog({
  trigger,
  personaId,
  dataSuggerita,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  /** Precompila la data del promemoria (es. la scadenza del giudizio vigente o la prossima visita prevista), sempre modificabile. */
  dataSuggerita?: string | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [oggetto, setOggetto] = useState("");
  const [data, setData] = useState("");
  const [ora, setOra] = useState("");
  const [destinatari, setDestinatari] = useState<string>(DESTINATARI_OPZIONI[0]);
  const [nota, setNota] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setOggetto("Promemoria visita di sorveglianza sanitaria");
      setData(dataSuggerita ?? "");
      setOra("");
      setDestinatari(DESTINATARI_OPZIONI[0]);
      setNota("");
      setErrore(null);
    }
  }

  async function onSubmit() {
    if (!oggetto.trim()) {
      setErrore("L'oggetto del promemoria è obbligatorio.");
      return;
    }
    if (!data) {
      setErrore("La data del promemoria è obbligatoria.");
      return;
    }

    setSalvando(true);
    setErrore(null);
    const risultato = await creaPromemoriaVisita(personaId, {
      oggetto: oggetto.trim(),
      data,
      ora: ora || null,
      destinatari,
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
          <DialogTitle>Nuovo promemoria</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pr-oggetto">Oggetto</Label>
            <Input id="pr-oggetto" value={oggetto} onChange={(e) => setOggetto(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pr-data">Data del promemoria</Label>
              <Input id="pr-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pr-ora">Ora</Label>
              <Input id="pr-ora" type="time" value={ora} onChange={(e) => setOra(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Destinatari</Label>
            <Select value={destinatari} onValueChange={setDestinatari}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DESTINATARI_OPZIONI.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pr-nota">Nota</Label>
            <Textarea id="pr-nota" value={nota} onChange={(e) => setNota(e.target.value)} />
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
