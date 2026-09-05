"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Esperienza, RilevanzaEsperienza } from "@/lib/types/personale-hr";

import { aggiornaEsperienza, creaEsperienza } from "./actions";

const RILEVANZA_OPZIONI: { value: RilevanzaEsperienza; label: string }[] = [
  { value: "PROFESSIONALE", label: "Professionale" },
  { value: "TECNICA", label: "Tecnica" },
  { value: "ORGANIZZATIVA", label: "Organizzativa" },
];

/** "Aggiungi esperienza"/"Modifica esperienza" (§13.3). "Esperienza in
 * corso" è semplicemente data_fine assente (§13.1 "Oggi"): nessuna
 * colonna dedicata. "Verificata" non è impostabile da qui — passa dal
 * comando di verifica dedicato (§13.4), riservato al consulente. */
export function EsperienzaDialog({
  trigger,
  personaId,
  esperienza,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  /** Presente solo in modifica. */
  esperienza?: Esperienza;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [attivitaRuolo, setAttivitaRuolo] = useState(esperienza?.attivita_ruolo ?? "");
  const [organizzazione, setOrganizzazione] = useState(esperienza?.organizzazione ?? "");
  const [dataInizio, setDataInizio] = useState(esperienza?.data_inizio ?? "");
  const [inCorso, setInCorso] = useState(esperienza ? esperienza.data_fine === null : true);
  const [dataFine, setDataFine] = useState(esperienza?.data_fine ?? "");
  const [rilevanza, setRilevanza] = useState<RilevanzaEsperienza>(esperienza?.rilevanza ?? "PROFESSIONALE");
  const [descrizione, setDescrizione] = useState(esperienza?.descrizione ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setAttivitaRuolo(esperienza?.attivita_ruolo ?? "");
      setOrganizzazione(esperienza?.organizzazione ?? "");
      setDataInizio(esperienza?.data_inizio ?? "");
      setInCorso(esperienza ? esperienza.data_fine === null : true);
      setDataFine(esperienza?.data_fine ?? "");
      setRilevanza(esperienza?.rilevanza ?? "PROFESSIONALE");
      setDescrizione(esperienza?.descrizione ?? "");
      setErrore(null);
    }
  }

  async function onSubmit() {
    if (!attivitaRuolo.trim()) {
      setErrore("Il ruolo o l'attività è obbligatorio.");
      return;
    }
    if (!inCorso && dataFine && dataInizio && dataFine < dataInizio) {
      setErrore("La data di fine non può precedere la data di inizio.");
      return;
    }
    setSalvando(true);
    setErrore(null);
    const payload = {
      attivita_ruolo: attivitaRuolo.trim(),
      organizzazione: organizzazione.trim() || null,
      data_inizio: dataInizio || null,
      data_fine: inCorso ? null : dataFine || null,
      rilevanza,
      descrizione: descrizione.trim() || null,
    };
    const risultato = esperienza ? await aggiornaEsperienza(esperienza.id, payload) : await creaEsperienza(personaId, payload);
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
          <DialogTitle>{esperienza ? "Modifica esperienza" : "Aggiungi esperienza"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="es-ruolo">Ruolo o attività</Label>
            <Input id="es-ruolo" value={attivitaRuolo} onChange={(e) => setAttivitaRuolo(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="es-org">Organizzazione</Label>
            <Input id="es-org" value={organizzazione} onChange={(e) => setOrganizzazione(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="es-inizio">Data di inizio</Label>
              <Input id="es-inizio" type="date" value={dataInizio} onChange={(e) => setDataInizio(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="es-fine">Data di fine</Label>
              <Input
                id="es-fine"
                type="date"
                value={dataFine}
                disabled={inCorso}
                onChange={(e) => setDataFine(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={inCorso} onCheckedChange={setInCorso} id="es-in-corso" />
            <Label htmlFor="es-in-corso">Esperienza in corso</Label>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Rilevanza</Label>
            <Select value={rilevanza} onValueChange={(v) => setRilevanza(v as RilevanzaEsperienza)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RILEVANZA_OPZIONI.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="es-descrizione">Descrizione dell&apos;esperienza</Label>
            <Textarea id="es-descrizione" value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
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
