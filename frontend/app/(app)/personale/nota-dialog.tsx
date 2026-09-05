"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Nota, NotaCategoriaVoce } from "@/lib/types/personale-hr";

import { aggiornaNota, creaNota } from "./actions";

/** Form unico "Nuova nota"/"Modifica nota" (§8-§9 e §11 della
 * specificazione "Costruzione della scheda 'Note'"): solo categoria e
 * testo, nessun titolo, nessuna visibilità (sempre interna ai consulenti,
 * decisa dal backend). La modifica aggiorna sempre lo stesso record,
 * mantenendo autore e data di creazione originali. */
export function NotaDialog({
  trigger,
  personaId,
  categorie,
  nota,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  categorie: NotaCategoriaVoce[];
  /** Presente solo in modifica. */
  nota?: Nota;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState(nota?.categoria ?? categorie[0]?.codice ?? "GENERALE");
  const [testo, setTesto] = useState(nota?.testo ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setCategoria(nota?.categoria ?? categorie[0]?.codice ?? "GENERALE");
      setTesto(nota?.testo ?? "");
      setErrore(null);
    }
  }

  async function onSubmit() {
    if (!testo.trim()) {
      setErrore("Il testo della nota è obbligatorio.");
      return;
    }
    setSalvando(true);
    setErrore(null);
    const payload = { categoria, testo: testo.trim() };
    const risultato = nota ? await aggiornaNota(nota.id, payload) : await creaNota(personaId, payload);
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
          <DialogTitle>{nota ? "Modifica nota" : "Nuova nota"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as typeof categoria)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorie.map((c) => (
                  <SelectItem key={c.codice} value={c.codice}>
                    {c.denominazione}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nota-testo">Nota</Label>
            <Textarea id="nota-testo" rows={5} value={testo} onChange={(e) => setTesto(e.target.value)} />
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
