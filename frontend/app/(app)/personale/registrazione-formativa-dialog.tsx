"use client";

import { UploadIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CatalogoAbilitazione, CatalogoCorso, RegistrazioneFormativa, TipoRegistrazioneFormativa } from "@/lib/types/personale-hr";

import { aggiornaRegistrazioneFormativa, creaCorsoFormazione, creaRegistrazioneFormativa } from "./actions";
import { QuickAddCatalogo } from "./quick-add-catalogo";

/** Form unico "Aggiungi attestato"/"Modifica registrazione" (§7-§14 della
 * correzione "Struttura di 'Formazione e abilitazioni'"): Formazione e
 * Abilitazione condividono lo stesso form, cambia solo l'origine delle
 * opzioni del campo "Corso/abilitazione" e la presenza di "Ente formatore".
 * Il tipo non è mai modificabile in modifica: Formazione e Abilitazione
 * vivono in due tabelle distinte lato backend (§17 e §19), quindi cambiare
 * tipo equivarrebbe a spostare la riga in un'altra tabella, non ad
 * aggiornarla — per questo il campo resta bloccato una volta creata la
 * registrazione. Il caricamento del file è un segnaposto non funzionante,
 * coerente con "Documenti personali" (nessun sistema di upload reale è
 * ancora stato costruito in piattaforma). */
export function RegistrazioneFormativaDialog({
  trigger,
  personaId,
  corsi,
  abilitazioni,
  registrazione,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  corsi: CatalogoCorso[];
  abilitazioni: CatalogoAbilitazione[];
  /** Presente solo in modifica. */
  registrazione?: RegistrazioneFormativa;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [corsiLocali, setCorsiLocali] = useState(corsi);
  const [tipo, setTipo] = useState<TipoRegistrazioneFormativa>(registrazione?.tipo ?? "FORMAZIONE");
  const [catalogoId, setCatalogoId] = useState(registrazione?.catalogo_id ?? "");
  const [enteFormatore, setEnteFormatore] = useState(registrazione?.ente_formatore ?? "");
  const [dataConseguimento, setDataConseguimento] = useState(registrazione?.data_conseguimento ?? "");
  const [dataScadenza, setDataScadenza] = useState(registrazione?.data_scadenza ?? "");
  const [durataOre, setDurataOre] = useState(registrazione?.durata_ore ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setCorsiLocali(corsi);
      setTipo(registrazione?.tipo ?? "FORMAZIONE");
      setCatalogoId(registrazione?.catalogo_id ?? "");
      setEnteFormatore(registrazione?.ente_formatore ?? "");
      setDataConseguimento(registrazione?.data_conseguimento ?? "");
      setDataScadenza(registrazione?.data_scadenza ?? "");
      setDurataOre(registrazione?.durata_ore ?? "");
      setErrore(null);
    }
  }

  function onTipoChange(nuovoTipo: TipoRegistrazioneFormativa) {
    setTipo(nuovoTipo);
    setCatalogoId("");
  }

  async function onSubmit() {
    if (!catalogoId) {
      setErrore(tipo === "FORMAZIONE" ? "Seleziona il corso." : "Seleziona l'abilitazione.");
      return;
    }
    if (!dataConseguimento || !dataScadenza) {
      setErrore("Data di conseguimento e data di scadenza sono obbligatorie.");
      return;
    }
    if (dataConseguimento > dataScadenza) {
      setErrore("La data di conseguimento non può essere successiva alla data di scadenza.");
      return;
    }
    if (!durataOre || Number(durataOre) <= 0) {
      setErrore("La durata deve essere maggiore di zero.");
      return;
    }
    if (tipo === "FORMAZIONE" && !enteFormatore.trim()) {
      setErrore("L'ente formatore è obbligatorio per la Formazione.");
      return;
    }

    setSalvando(true);
    setErrore(null);
    const payload = {
      tipo,
      catalogo_id: catalogoId,
      data_conseguimento: dataConseguimento,
      data_scadenza: dataScadenza,
      durata_ore: durataOre,
      ente_formatore: tipo === "FORMAZIONE" ? enteFormatore.trim() : null,
    };
    const risultato = registrazione
      ? await aggiornaRegistrazioneFormativa(registrazione.id, payload)
      : await creaRegistrazioneFormativa(personaId, payload);
    setSalvando(false);
    if (risultato.ok) {
      setOpen(false);
      onSaved();
    } else {
      setErrore(typeof risultato.detail === "string" ? risultato.detail : "Dati non validi.");
    }
  }

  const opzioniCatalogo = tipo === "FORMAZIONE" ? corsiLocali : abilitazioni;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{registrazione ? "Modifica registrazione" : "Aggiungi attestato"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label>Tipo di attestato</Label>
            <Select value={tipo} onValueChange={(v) => onTipoChange(v as TipoRegistrazioneFormativa)} disabled={!!registrazione}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FORMAZIONE">F — Formazione</SelectItem>
                <SelectItem value="ABILITAZIONE">A — Abilitazione</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{tipo === "FORMAZIONE" ? "Corso dell'attestato" : "Abilitazione dell'attestato"}</Label>
            <Select value={catalogoId} onValueChange={setCatalogoId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                {opzioniCatalogo.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.denominazione}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tipo === "FORMAZIONE" && (
              <QuickAddCatalogo
                etichetta="corso"
                onCreate={async (denominazione) => {
                  const r = await creaCorsoFormazione({ codice: denominazione.toUpperCase().replace(/\s+/g, "_"), denominazione });
                  if (r.ok) {
                    setCorsiLocali((prev) => [...prev, r.data]);
                    setCatalogoId(r.data.id);
                  }
                  return r.ok;
                }}
              />
            )}
          </div>

          {tipo === "FORMAZIONE" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rf-ente">Ente formatore</Label>
              <Input id="rf-ente" value={enteFormatore} onChange={(e) => setEnteFormatore(e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rf-conseguimento">Data di conseguimento</Label>
              <Input
                id="rf-conseguimento"
                type="date"
                value={dataConseguimento}
                onChange={(e) => setDataConseguimento(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rf-scadenza">Data di scadenza</Label>
              <Input id="rf-scadenza" type="date" value={dataScadenza} onChange={(e) => setDataScadenza(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rf-durata">Durata del corso (ore)</Label>
            <Input
              id="rf-durata"
              type="number"
              min="0"
              step="0.5"
              value={durataOre}
              onChange={(e) => setDurataOre(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>File dell'attestato</Label>
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">
              <UploadIcon className="size-6" />
              <p className="text-sm">Trascina qui il file, o clicca per selezionarlo.</p>
              <p className="text-xs">Il caricamento reale sarà disponibile in una sessione dedicata al modulo Documenti.</p>
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
