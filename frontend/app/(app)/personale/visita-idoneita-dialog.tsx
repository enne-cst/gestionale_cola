"use client";

import { UploadIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { GiudizioIdoneita, GiudizioIdoneitaValore, TipoVisita } from "@/lib/types/personale-hr";

import { aggiornaVisitaIdoneita, creaVisitaIdoneita } from "./actions";

const GIUDIZIO_OPZIONI: { value: GiudizioIdoneitaValore; label: string }[] = [
  { value: "IDONEO", label: "Idoneo" },
  { value: "IDONEO_CON_PRESCRIZIONI", label: "Idoneo con prescrizioni" },
  { value: "IDONEO_TEMPORANEAMENTE", label: "Temporaneamente non idoneo" },
  { value: "NON_IDONEO", label: "Non idoneo" },
];

/** Somma mesi di calendario, riducendo il giorno al massimo valido del mese
 * di arrivo: solo per PROPORRE la scadenza in UI, stessa logica di
 * `_aggiungi_mesi` nel backend (che resta l'autorità: rivalida comunque). */
function aggiungiMesi(dataIso: string, mesi: number): string {
  const [anno, mese, giorno] = dataIso.split("-").map(Number);
  const meseTotale = mese - 1 + mesi;
  const annoArrivo = anno + Math.floor(meseTotale / 12);
  const meseArrivo = ((meseTotale % 12) + 12) % 12;
  const ultimoGiorno = new Date(annoArrivo, meseArrivo + 1, 0).getDate();
  const giornoArrivo = Math.min(giorno, ultimoGiorno);
  return `${annoArrivo}-${String(meseArrivo + 1).padStart(2, "0")}-${String(giornoArrivo).padStart(2, "0")}`;
}

/** Form unico "Registra visita"/"Modifica visita" (§4-§8 della precisazione
 * "Struttura di 'Idoneità sanitaria'"). La scadenza è proposta come
 * data_visita + periodicità ma resta sempre modificabile (§5): se l'utente
 * l'ha già personalizzata e poi cambia data o periodicità, si chiede
 * conferma prima di sovrascriverla (banner inline, nessun ricalcolo
 * silenzioso). Il caricamento del documento è un segnaposto non
 * funzionante, coerente con "Documenti personali"/"Formazione e
 * abilitazioni" (nessun sistema di upload reale ancora in piattaforma). */
export function VisitaIdoneitaDialog({
  trigger,
  personaId,
  tipiVisita,
  visita,
  onSaved,
}: {
  trigger: ReactNode;
  personaId: string;
  tipiVisita: TipoVisita[];
  /** Presente solo in modifica. */
  visita?: GiudizioIdoneita;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tipoVisitaId, setTipoVisitaId] = useState(visita?.tipo_visita.id ?? "");
  const [dataVisita, setDataVisita] = useState(visita?.data_visita ?? "");
  const [giudizio, setGiudizio] = useState<GiudizioIdoneitaValore>(visita?.giudizio ?? "IDONEO");
  const [periodicitaMesi, setPeriodicitaMesi] = useState(visita?.periodicita_mesi?.toString() ?? "");
  const [dataScadenza, setDataScadenza] = useState(visita?.data_scadenza ?? "");
  const [scadenzaPersonalizzata, setScadenzaPersonalizzata] = useState(false);
  const [richiestaRicalcolo, setRichiestaRicalcolo] = useState<string | null>(null);
  const [medicoCompetente, setMedicoCompetente] = useState(visita?.medico_competente ?? "");
  const [prescrizioniPresenti, setPrescrizioniPresenti] = useState(visita?.prescrizioni_presenti ?? false);
  const [prescrizioniMinime, setPrescrizioniMinime] = useState(visita?.prescrizioni_minime ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function reset() {
    setTipoVisitaId(visita?.tipo_visita.id ?? "");
    setDataVisita(visita?.data_visita ?? "");
    setGiudizio(visita?.giudizio ?? "IDONEO");
    setPeriodicitaMesi(visita?.periodicita_mesi?.toString() ?? "");
    setDataScadenza(visita?.data_scadenza ?? "");
    setScadenzaPersonalizzata(false);
    setRichiestaRicalcolo(null);
    setMedicoCompetente(visita?.medico_competente ?? "");
    setPrescrizioniPresenti(visita?.prescrizioni_presenti ?? false);
    setPrescrizioniMinime(visita?.prescrizioni_minime ?? "");
    setErrore(null);
  }

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) reset();
  }

  function proponiScadenza(nuovaDataVisita: string, nuovaPeriodicita: string) {
    const mesi = Number(nuovaPeriodicita);
    if (!nuovaDataVisita || !nuovaPeriodicita || !Number.isFinite(mesi) || mesi <= 0) return;
    const proposta = aggiungiMesi(nuovaDataVisita, mesi);
    if (scadenzaPersonalizzata && dataScadenza && dataScadenza !== proposta) {
      setRichiestaRicalcolo(proposta);
      return;
    }
    setDataScadenza(proposta);
  }

  function onDataVisitaChange(v: string) {
    setDataVisita(v);
    proponiScadenza(v, periodicitaMesi);
  }

  function onPeriodicitaChange(v: string) {
    setPeriodicitaMesi(v);
    proponiScadenza(dataVisita, v);
  }

  function onDataScadenzaChange(v: string) {
    setDataScadenza(v);
    setScadenzaPersonalizzata(true);
    setRichiestaRicalcolo(null);
  }

  async function onSubmit() {
    if (!tipoVisitaId) {
      setErrore("Seleziona il tipo di visita.");
      return;
    }
    if (!dataVisita) {
      setErrore("La data della visita è obbligatoria.");
      return;
    }
    if (dataVisita > new Date().toISOString().slice(0, 10)) {
      setErrore("La data della visita non può essere futura.");
      return;
    }
    if (periodicitaMesi && Number(periodicitaMesi) <= 0) {
      setErrore("La periodicità deve essere maggiore di zero.");
      return;
    }
    if (dataScadenza && dataScadenza < dataVisita) {
      setErrore("La scadenza non può precedere la data della visita.");
      return;
    }
    if (prescrizioniPresenti && !prescrizioniMinime.trim()) {
      setErrore("Il testo delle prescrizioni è obbligatorio quando sono presenti limitazioni o prescrizioni.");
      return;
    }
    if (giudizio === "IDONEO_CON_PRESCRIZIONI" && !prescrizioniPresenti) {
      setErrore("Il giudizio 'Idoneo con prescrizioni' richiede di segnalare le prescrizioni presenti.");
      return;
    }

    setSalvando(true);
    setErrore(null);
    const payload = {
      tipo_visita_id: tipoVisitaId,
      data_visita: dataVisita,
      giudizio,
      periodicita_mesi: periodicitaMesi ? Number(periodicitaMesi) : null,
      data_scadenza: dataScadenza || null,
      medico_competente: medicoCompetente.trim() || null,
      prescrizioni_presenti: prescrizioniPresenti,
      prescrizioni_minime: prescrizioniPresenti ? prescrizioniMinime.trim() : null,
    };
    const risultato = visita ? await aggiornaVisitaIdoneita(visita.id, payload) : await creaVisitaIdoneita(personaId, payload);
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
          <DialogTitle>{visita ? "Modifica visita" : "Registra visita"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <span>🔒</span>
            <span>Dati sanitari protetti · registra soltanto le informazioni ammesse e necessarie.</span>
          </div>

          <FormError message={errore ?? undefined} />

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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vi-data">Data della visita</Label>
              <Input id="vi-data" type="date" value={dataVisita} onChange={(e) => onDataVisitaChange(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Giudizio di idoneità</Label>
              <Select value={giudizio} onValueChange={(v) => setGiudizio(v as GiudizioIdoneitaValore)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GIUDIZIO_OPZIONI.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vi-periodicita">Periodicità (mesi)</Label>
              <Input
                id="vi-periodicita"
                type="number"
                min="1"
                value={periodicitaMesi}
                onChange={(e) => onPeriodicitaChange(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vi-scadenza">Scadenza del giudizio</Label>
              <Input id="vi-scadenza" type="date" value={dataScadenza} onChange={(e) => onDataScadenzaChange(e.target.value)} />
            </div>
          </div>

          {bannerRicalcoloScadenza(richiestaRicalcolo, () => {
            if (richiestaRicalcolo) setDataScadenza(richiestaRicalcolo);
            setScadenzaPersonalizzata(false);
            setRichiestaRicalcolo(null);
          }, () => setRichiestaRicalcolo(null))}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vi-medico">Medico competente</Label>
            <Input id="vi-medico" value={medicoCompetente} onChange={(e) => setMedicoCompetente(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={prescrizioniPresenti} onCheckedChange={setPrescrizioniPresenti} id="vi-prescrizioni-presenti" />
            <Label htmlFor="vi-prescrizioni-presenti">Limitazioni o prescrizioni presenti</Label>
          </div>

          {prescrizioniPresenti && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vi-prescrizioni-testo">Prescrizioni minime</Label>
              <Textarea
                id="vi-prescrizioni-testo"
                value={prescrizioniMinime}
                onChange={(e) => setPrescrizioniMinime(e.target.value)}
                placeholder="Solo indicazioni operative necessarie per l'attività lavorativa: non inserire diagnosi o dati sanitari non necessari."
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Documento del giudizio</Label>
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">
              <UploadIcon className="size-6" />
              <p className="text-sm">Trascina qui il file, o clicca per selezionarlo.</p>
              <p className="text-xs">
                Facoltativo: la visita viene registrata comunque, il documento potrà essere aggiunto in seguito. Il
                caricamento reale sarà disponibile in una sessione dedicata al modulo Documenti.
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

function bannerRicalcoloScadenza(proposta: string | null, onRicalcola: () => void, onMantieni: () => void) {
  if (!proposta) return null;
  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-400/50 bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30">
      <span>La data della visita o la periodicità sono cambiate: vuoi ricalcolare la scadenza personalizzata?</span>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onMantieni}>
          Mantieni scadenza attuale
        </Button>
        <Button type="button" size="sm" onClick={onRicalcola}>
          Ricalcola scadenza
        </Button>
      </div>
    </div>
  );
}
