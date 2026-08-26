"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { CaratteristicaField } from "@/components/registro/caratteristica-field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Label } from "@/components/ui/label";
import { PersonaPicker, type PersonaLike } from "@/components/registro/persona-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { separaCaratteristicheCciaa } from "@/lib/cciaa-incarichi-caratteristiche";
import { aggiornaIncarico, creaIncarico, getCaratteristicheRuolo } from "@/lib/actions/personale";
import type { AnaPersona, CaratteristicaRuolo, Incarico, RuoloSummary, ValoreIncarico } from "@/lib/types/personale";

/** Dialogo di creazione/modifica di un incarico (§sezione N della specifica
 * CCIAA — Soci/Amministratori/Sindaci): il form si costruisce da solo a
 * partire dalle caratteristiche richieste dal ruolo scelto
 * (`GET /api/personale/ruoli/{id}/caratteristiche`), non da campi statici
 * scritti per ogni ruolo — un ruolo nuovo aggiunto in futuro al catalogo
 * funziona qui senza modifiche al frontend. */
export function IncaricoFormDialog({
  trigger,
  ruoli,
  incarico,
  onSaved,
}: {
  trigger: ReactNode;
  // Ruoli selezionabili in creazione (es. Amministratore/Amministratore
  // Delegato/Componente CdA per la card "Amministratori"). In modifica il
  // ruolo dell'incarico esistente resta fisso.
  ruoli: RuoloSummary[];
  incarico?: Incarico;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [persona, setPersona] = useState<PersonaLike | AnaPersona | null>(incarico?.persona ?? null);
  const [ruoloId, setRuoloId] = useState<string>(incarico?.ruolo_id ?? ruoli[0]?.id ?? "");
  const [caratteristiche, setCaratteristiche] = useState<{ principali: CaratteristicaRuolo[]; altre: CaratteristicaRuolo[] } | null>(
    null,
  );
  const [mostraAltre, setMostraAltre] = useState(false);
  const [valori, setValori] = useState<Record<string, ValoreIncarico>>(incarico?.valori ?? {});
  const [note, setNote] = useState(incarico?.note ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const ruoloSelezionato = useMemo(() => ruoli.find((r) => r.id === ruoloId), [ruoli, ruoloId]);

  useEffect(() => {
    if (!open || !ruoloId) return;
    setCaratteristiche(null);
    setMostraAltre(false);
    const codiceRuolo = ruoloSelezionato?.codice ?? "";
    getCaratteristicheRuolo(ruoloId)
      .then((tutte) => setCaratteristiche(separaCaratteristicheCciaa(codiceRuolo, tutte)))
      .catch(() => setCaratteristiche({ principali: [], altre: [] }));
  }, [open, ruoloId, ruoloSelezionato]);

  async function onSubmit() {
    if (!persona) {
      setErrore("Seleziona o crea una persona.");
      return;
    }
    if (!ruoloId) {
      setErrore("Seleziona un ruolo.");
      return;
    }
    setSalvando(true);
    setErrore(null);
    const payload = { persona_id: persona.id, ruolo_id: ruoloId, note: note || null, valori };
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
          <DialogTitle>{incarico ? "Modifica incarico" : "Nuovo incarico"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label>Persona</Label>
            <PersonaPicker value={persona} onChange={setPersona} />
          </div>

          {ruoli.length > 1 && !incarico && (
            <div className="flex flex-col gap-1.5">
              <Label>Ruolo</Label>
              <Select value={ruoloId} onValueChange={setRuoloId}>
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
          )}
          {ruoli.length === 1 && <p className="text-sm text-muted-foreground">Ruolo: {ruoli[0].denominazione}</p>}
          {incarico && ruoloSelezionato && <p className="text-sm text-muted-foreground">Ruolo: {ruoloSelezionato.denominazione}</p>}

          {caratteristiche === null ? (
            <p className="text-sm text-muted-foreground">Caricamento campi del ruolo…</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {caratteristiche.principali.map((c) => (
                  <CaratteristicaField
                    key={c.id}
                    caratteristica={c}
                    value={valori[c.codice] ?? null}
                    onChange={(v) => setValori((prev) => ({ ...prev, [c.codice]: v }))}
                  />
                ))}
              </div>

              {caratteristiche.altre.length > 0 && (
                <div className="border-t pt-3">
                  <button
                    type="button"
                    onClick={() => setMostraAltre((v) => !v)}
                    className="text-sm font-semibold text-[var(--az-blue)] hover:underline"
                  >
                    {mostraAltre ? "Nascondi" : "Mostra"} altri campi del ruolo ({caratteristiche.altre.length})
                  </button>
                  {/* Campi del catalogo condiviso non specifici della visura camerale
                   * (es. documenti di nomina, assenza di cause ostative, pensati per
                   * altri usi del motore incarichi): restano qui, non nella sezione
                   * principale, ma vanno comunque compilabili — alcuni sono
                   * obbligatori per il ruolo e il salvataggio li richiede. */}
                  {mostraAltre && (
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {caratteristiche.altre.map((c) => (
                        <CaratteristicaField
                          key={c.id}
                          caratteristica={c}
                          value={valori[c.codice] ?? null}
                          onChange={(v) => setValori((prev) => ({ ...prev, [c.codice]: v }))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="incarico-note">Note</Label>
            <Textarea id="incarico-note" value={note} onChange={(e) => setNote(e.target.value)} />
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
