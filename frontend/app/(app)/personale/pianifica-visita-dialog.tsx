"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AppuntamentoVisita, TipoVisita } from "@/lib/types/personale-hr";

import { aggiornaAppuntamentoVisita, creaAppuntamentoVisita } from "./actions";

/** "Pianifica visita" (§14): crea o aggiorna un appuntamento reale nello
 * Scadenziario (per_attivita), distinto dal giudizio di idoneità — non crea
 * mai un nuovo giudizio, non modifica la scadenza di quello vigente. In
 * modifica il tipo di visita non è più editabile (il titolo dell'attività è
 * fissato alla creazione, come Formazione/Abilitazione dopo il salvataggio):
 * solo data, ora, medico, luogo e indicazioni organizzative restano
 * modificabili. */
export function PianificaVisitaDialog({
  trigger,
  personaId,
  tipiVisita,
  appuntamento,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  tipiVisita: TipoVisita[];
  /** Presente solo in modifica di un appuntamento già pianificato. */
  appuntamento?: AppuntamentoVisita;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tipoVisitaId, setTipoVisitaId] = useState("");
  const [data, setData] = useState(appuntamento?.data ?? "");
  const [ora, setOra] = useState(appuntamento?.ora?.slice(0, 5) ?? "");
  const [medicoCompetente, setMedicoCompetente] = useState(appuntamento?.medico_competente ?? "");
  const [luogo, setLuogo] = useState(appuntamento?.luogo ?? "");
  const [note, setNote] = useState(appuntamento?.note ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setTipoVisitaId("");
      setData(appuntamento?.data ?? "");
      setOra(appuntamento?.ora?.slice(0, 5) ?? "");
      setMedicoCompetente(appuntamento?.medico_competente ?? "");
      setLuogo(appuntamento?.luogo ?? "");
      setNote(appuntamento?.note ?? "");
      setErrore(null);
    }
  }

  async function onSubmit() {
    if (!appuntamento && !tipoVisitaId) {
      setErrore("Seleziona il tipo di visita.");
      return;
    }
    if (!data) {
      setErrore("La data dell'appuntamento è obbligatoria.");
      return;
    }
    if (!appuntamento && data < new Date().toISOString().slice(0, 10)) {
      setErrore("La data dell'appuntamento non può essere nel passato.");
      return;
    }

    setSalvando(true);
    setErrore(null);
    const risultato = appuntamento
      ? await aggiornaAppuntamentoVisita(appuntamento.id, {
          data,
          ora: ora || null,
          medico_competente: medicoCompetente.trim() || null,
          luogo: luogo.trim() || null,
          note: note.trim() || null,
          stato: "PIANIFICATA",
        })
      : await creaAppuntamentoVisita(personaId, {
          tipo_visita_id: tipoVisitaId,
          data,
          ora: ora || null,
          medico_competente: medicoCompetente.trim() || null,
          luogo: luogo.trim() || null,
          note: note.trim() || null,
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
          <DialogTitle>{appuntamento ? "Modifica appuntamento" : "Pianifica visita"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <span>🔒</span>
            <span>Pianificazione riservata · l&apos;appuntamento sarà visibile solo agli utenti autorizzati.</span>
          </div>

          <FormError message={errore ?? undefined} />

          {!appuntamento && (
            <div className="flex flex-col gap-1.5">
              <Label>Tipo di visita</Label>
              <Select value={tipoVisitaId} onValueChange={setTipoVisitaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  {tipiVisita.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.denominazione}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pv-data">Data</Label>
              <Input id="pv-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pv-ora">Ora</Label>
              <Input id="pv-ora" type="time" value={ora} onChange={(e) => setOra(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pv-medico">Medico competente</Label>
            <Input id="pv-medico" value={medicoCompetente} onChange={(e) => setMedicoCompetente(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pv-luogo">Luogo</Label>
            <Input id="pv-luogo" placeholder="Ambulatorio / sede" value={luogo} onChange={(e) => setLuogo(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pv-note">Indicazioni organizzative</Label>
            <Textarea id="pv-note" value={note} onChange={(e) => setNote(e.target.value)} />
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
