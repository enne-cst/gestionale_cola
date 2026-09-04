"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { CaratteristicaField } from "@/components/registro/caratteristica-field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { aggiornaIncarico, creaIncarico, getCaratteristicheRuolo, getIncarico } from "@/lib/actions/personale";
import type { CaratteristicaRuolo, RuoloSummary, ValoreIncarico } from "@/lib/types/personale";
import type { PersonaRuolo } from "@/lib/types/personale-hr";

export const AMBITO_LABEL: Record<string, string> = {
  GOVERNANCE: "Governance",
  SICUREZZA: "Sicurezza",
  QUALITA: "Qualità",
  AMBIENTE: "Ambiente",
  ORGANIZZAZIONE: "Organizzazione",
  ALTRO: "Altro",
};

/** Form "Assegna ruolo"/"Modifica assegnazione" (§10 della correzione
 * "Ruoli e responsabilità"): il ruolo si sceglie dal catalogo esistente,
 * "Data di inizio"/"Data di fine" sono le caratteristiche A01/A02 già
 * previste dal motore incarichi (nessuna colonna nuova), "Ambito" è solo
 * mostrato (deriva dal ruolo, non è un campo dell'assegnazione). Il campo
 * "Documento" è dinamico: una CaratteristicaField per ogni caratteristica
 * di tipo DOCUMENTO configurata sul ruolo scelto (decisione esplicita
 * dell'utente — un ruolo può averne zero, una o più). Le eventuali altre
 * caratteristiche obbligatorie del ruolo (es. per i ruoli camerali) restano
 * comunque compilabili sotto, così il salvataggio non fallisce mai per un
 * campo mancante che questo form non conosceva. */
export function AssegnaRuoloDialog({
  trigger,
  personaId,
  ruoli,
  incarico,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  ruoli: RuoloSummary[];
  /** Presente solo in modifica: l'assegnazione esistente da riaprire. */
  incarico?: PersonaRuolo;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [ruoloId, setRuoloId] = useState(incarico?.ruolo_id ?? "");
  const [caratteristiche, setCaratteristiche] = useState<CaratteristicaRuolo[] | null>(null);
  const [valori, setValori] = useState<Record<string, ValoreIncarico>>({});
  const [note, setNote] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [caricandoIncarico, setCaricandoIncarico] = useState(false);

  const ruoloSelezionato = useMemo(() => ruoli.find((r) => r.id === ruoloId), [ruoli, ruoloId]);

  useEffect(() => {
    if (!open) return;
    setErrore(null);
    if (incarico) {
      setCaricandoIncarico(true);
      getIncarico(incarico.id)
        .then((i) => {
          setRuoloId(i.ruolo_id);
          setValori(i.valori);
          setNote(i.note ?? "");
        })
        .catch(() => setErrore("Impossibile caricare l'assegnazione."))
        .finally(() => setCaricandoIncarico(false));
    } else {
      setRuoloId("");
      setValori({});
      setNote("");
    }
  }, [open, incarico]);

  useEffect(() => {
    if (!open || !ruoloId) {
      setCaratteristiche(null);
      return;
    }
    getCaratteristicheRuolo(ruoloId)
      .then(setCaratteristiche)
      .catch(() => setCaratteristiche([]));
  }, [open, ruoloId]);

  const dataInizioChar = caratteristiche?.find((c) => c.codice === "A01");
  const dataFineChar = caratteristiche?.find((c) => c.codice === "A02");
  const documentoChars = caratteristiche?.filter((c) => c.tipoDato === "DOCUMENTO") ?? [];
  const altreChar = caratteristiche?.filter((c) => c.codice !== "A01" && c.codice !== "A02" && c.tipoDato !== "DOCUMENTO") ?? [];

  function setValore(codice: string, v: ValoreIncarico) {
    setValori((prev) => ({ ...prev, [codice]: v }));
  }

  async function onSubmit() {
    if (!ruoloId) {
      setErrore("Seleziona un ruolo.");
      return;
    }
    setSalvando(true);
    setErrore(null);
    const payload = { persona_id: personaId, ruolo_id: ruoloId, note: note || null, valori, fonte: "AZIENDA" };
    const esito = incarico ? await aggiornaIncarico(incarico.id, payload) : await creaIncarico(payload);
    setSalvando(false);
    if (esito.esito === "ok") {
      setOpen(false);
      onSaved();
    } else {
      setErrore(esito.messaggio);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{incarico ? "Modifica assegnazione" : "Assegna ruolo"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label>Ruolo</Label>
            <Select value={ruoloId} onValueChange={setRuoloId} disabled={!!incarico}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un ruolo…" />
              </SelectTrigger>
              <SelectContent>
                {ruoli.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.denominazione}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {ruoloSelezionato && (
            <div className="flex flex-col gap-1.5">
              <Label>Ambito</Label>
              <p className="text-sm text-muted-foreground">
                {ruoloSelezionato.ambito ? (AMBITO_LABEL[ruoloSelezionato.ambito] ?? ruoloSelezionato.ambito) : "—"}
              </p>
            </div>
          )}

          {caricandoIncarico || (ruoloId && caratteristiche === null) ? (
            <p className="text-sm text-muted-foreground">Caricamento campi del ruolo…</p>
          ) : ruoloId ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {dataInizioChar && (
                  <CaratteristicaField
                    caratteristica={{ ...dataInizioChar, denominazione: "Data di inizio" }}
                    value={valori.A01 ?? null}
                    onChange={(v) => setValore("A01", v)}
                  />
                )}
                {dataFineChar && (
                  <CaratteristicaField
                    caratteristica={{ ...dataFineChar, denominazione: "Data di fine" }}
                    value={valori.A02 ?? null}
                    onChange={(v) => setValore("A02", v)}
                  />
                )}
              </div>

              {documentoChars.length > 0 && (
                <div className="grid grid-cols-1 gap-4 border-t pt-3 sm:grid-cols-2">
                  {documentoChars.map((c) => (
                    <CaratteristicaField
                      key={c.id}
                      caratteristica={c}
                      value={valori[c.codice] ?? null}
                      onChange={(v) => setValore(c.codice, v)}
                    />
                  ))}
                </div>
              )}

              {altreChar.length > 0 && (
                <div className="grid grid-cols-1 gap-4 border-t pt-3 sm:grid-cols-2">
                  {altreChar.map((c) => (
                    <CaratteristicaField
                      key={c.id}
                      caratteristica={c}
                      value={valori[c.codice] ?? null}
                      onChange={(v) => setValore(c.codice, v)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assegna-ruolo-note">Note</Label>
            <Textarea id="assegna-ruolo-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={salvando}>
              Annulla
            </Button>
            <Button type="button" onClick={onSubmit} disabled={salvando || !ruoloId}>
              {salvando ? "Salvataggio…" : "Salva"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
