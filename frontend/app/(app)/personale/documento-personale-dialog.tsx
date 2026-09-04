"use client";

import { UploadIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aggiornaDocumentoPersona, creaDocumentoPersona } from "./actions";
import type { CatalogoVoce, DocumentoPersonale } from "@/lib/types/personale-hr";

// § 5.3 della correzione: il tipo scelto contestualizza solo etichetta ed
// esempio del campo "Numero", non un modale diverso. Chiave = codice del
// catalogo cat_tipi_documento_identita (migrazione 019).
const ETICHETTA_NUMERO: Record<string, string> = {
  CARTA_IDENTITA: "Numero carta d'identità",
  PATENTE: "Numero patente",
  PASSAPORTO: "Numero passaporto",
  PERMESSO_SOGGIORNO: "Numero permesso di soggiorno",
};

/** Form unico "Aggiungi documento"/"Modifica documento" (§5-§7 della
 * correzione "Documenti personali multipli"). Il permesso di soggiorno non
 * è più un campo a parte: è una delle tipologie di `tipiDocumento` come le
 * altre (§5.4). L'area di caricamento è presente ma non funzionante — nessun
 * sistema di upload esiste ancora nel progetto (decisione utente esplicita,
 * rimandato a una sessione dedicata al modulo Documenti): qui c'è solo lo
 * spazio previsto, con un testo che lo dichiara esplicitamente. */
export function DocumentoPersonaleDialog({
  trigger,
  personaId,
  tipiDocumento,
  documento,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  tipiDocumento: CatalogoVoce[];
  /** Presente solo in modifica. */
  documento?: DocumentoPersonale;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tipoDocumentoId, setTipoDocumentoId] = useState(documento?.tipo_documento.id ?? "");
  const [numero, setNumero] = useState(documento?.numero ?? "");
  const [dataRilascio, setDataRilascio] = useState(documento?.data_rilascio ?? "");
  const [dataScadenza, setDataScadenza] = useState(documento?.data_scadenza ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const tipoSelezionato = tipiDocumento.find((t) => t.id === tipoDocumentoId);
  const etichettaNumero = tipoSelezionato ? (ETICHETTA_NUMERO[tipoSelezionato.codice] ?? "Numero documento") : "Numero documento";

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setTipoDocumentoId(documento?.tipo_documento.id ?? "");
      setNumero(documento?.numero ?? "");
      setDataRilascio(documento?.data_rilascio ?? "");
      setDataScadenza(documento?.data_scadenza ?? "");
      setErrore(null);
    }
  }

  async function onSubmit() {
    if (!tipoDocumentoId) {
      setErrore("Seleziona il tipo di documento.");
      return;
    }
    setSalvando(true);
    setErrore(null);
    const payload = {
      tipo_documento_id: tipoDocumentoId,
      numero: numero || null,
      data_rilascio: dataRilascio || null,
      data_scadenza: dataScadenza || null,
    };
    const risultato = documento
      ? await aggiornaDocumentoPersona(documento.id, payload)
      : await creaDocumentoPersona(personaId, payload);
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
          <DialogTitle>{documento ? "Modifica documento" : "Aggiungi documento"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label>Tipo di documento</Label>
            <Select value={tipoDocumentoId} onValueChange={setTipoDocumentoId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                {tipiDocumento.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.denominazione}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="documento-numero">{etichettaNumero}</Label>
            <Input id="documento-numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documento-data-rilascio">Data di rilascio</Label>
              <Input
                id="documento-data-rilascio"
                type="date"
                value={dataRilascio}
                onChange={(e) => setDataRilascio(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documento-data-scadenza">Data di scadenza</Label>
              <Input
                id="documento-data-scadenza"
                type="date"
                value={dataScadenza}
                onChange={(e) => setDataScadenza(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Carica documenti</Label>
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">
              <UploadIcon className="size-6" />
              <p className="text-sm">Trascina qui uno o più file, o clicca per selezionarli.</p>
              <p className="text-xs">Il caricamento reale sarà disponibile in una sessione dedicata al modulo Documenti.</p>
            </div>
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
