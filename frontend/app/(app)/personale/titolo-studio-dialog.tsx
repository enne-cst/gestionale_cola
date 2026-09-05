"use client";

import { UploadIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CatalogoVoce, TitoloStudio } from "@/lib/types/personale-hr";

import { aggiornaTitoloStudio, creaTitoloStudio } from "./actions";

/** "Aggiungi titolo"/"Modifica titolo" (§12.3): la tipologia proviene
 * sempre dal catalogo esistente, mai testo libero. Il documento resta un
 * segnaposto non funzionante, coerente col resto del modulo (nessun
 * upload reale ancora in piattaforma); la sua assenza non impedisce il
 * salvataggio (§12.4). */
export function TitoloStudioDialog({
  trigger,
  personaId,
  catalogo,
  titolo,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  catalogo: CatalogoVoce[];
  /** Presente solo in modifica. */
  titolo?: TitoloStudio;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tipologiaId, setTipologiaId] = useState(titolo?.tipologia.id ?? "");
  const [indirizzo, setIndirizzo] = useState(titolo?.indirizzo_specializzazione ?? "");
  const [istituto, setIstituto] = useState(titolo?.istituto ?? "");
  const [anno, setAnno] = useState(titolo?.anno?.toString() ?? "");
  const [votazione, setVotazione] = useState(titolo?.votazione ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setTipologiaId(titolo?.tipologia.id ?? "");
      setIndirizzo(titolo?.indirizzo_specializzazione ?? "");
      setIstituto(titolo?.istituto ?? "");
      setAnno(titolo?.anno?.toString() ?? "");
      setVotazione(titolo?.votazione ?? "");
      setErrore(null);
    }
  }

  async function onSubmit() {
    if (!tipologiaId) {
      setErrore("Seleziona il titolo di studio.");
      return;
    }
    setSalvando(true);
    setErrore(null);
    const payload = {
      tipologia_titolo_id: tipologiaId,
      indirizzo_specializzazione: indirizzo.trim() || null,
      istituto: istituto.trim() || null,
      anno: anno ? Number(anno) : null,
      votazione: votazione.trim() || null,
    };
    const risultato = titolo ? await aggiornaTitoloStudio(titolo.id, payload) : await creaTitoloStudio(personaId, payload);
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
          <DialogTitle>{titolo ? "Modifica titolo" : "Aggiungi titolo"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label>Titolo di studio</Label>
            <Select value={tipologiaId} onValueChange={setTipologiaId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                {catalogo.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.denominazione}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ts-indirizzo">Indirizzo o specializzazione</Label>
            <Input id="ts-indirizzo" value={indirizzo} onChange={(e) => setIndirizzo(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ts-istituto">Istituto o ateneo</Label>
            <Input id="ts-istituto" value={istituto} onChange={(e) => setIstituto(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ts-anno">Anno di conseguimento</Label>
              <Input id="ts-anno" type="number" value={anno} onChange={(e) => setAnno(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ts-votazione">Votazione (facoltativa)</Label>
              <Input id="ts-votazione" value={votazione} onChange={(e) => setVotazione(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Documento</Label>
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">
              <UploadIcon className="size-6" />
              <p className="text-sm">Trascina qui il file, o clicca per selezionarlo.</p>
              <p className="text-xs">
                Facoltativo: il titolo viene salvato comunque. Il caricamento reale sarà disponibile in una sessione
                dedicata al modulo Documenti.
              </p>
            </div>
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
