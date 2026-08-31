"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { CaratteristicaField } from "@/components/registro/caratteristica-field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { Label } from "@/components/ui/label";
import { PersonaGiuridicaPicker, type PersonaGiuridicaLike } from "@/components/registro/persona-giuridica-picker";
import { PersonaPicker, type PersonaLike } from "@/components/registro/persona-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { separaCaratteristicheCciaa } from "@/lib/cciaa-incarichi-caratteristiche";
import { aggiornaIncarico, creaIncarico, getCaratteristicheRuolo, type TitolareCaricaCollegio } from "@/lib/actions/personale";
import type {
  AnaPersona,
  AnaPersonaGiuridica,
  CaratteristicaRuolo,
  Incarico,
  RuoloSummary,
  ValoreIncarico,
} from "@/lib/types/personale";

// § Correzione 14, decisione esplicita (AskUserQuestion): la distinzione
// Presidente/Sindaco effettivo/Sindaco supplente riusa la caratteristica
// A28 "Tipologia di incarico" già associata al ruolo SINDACO, ma SOLO
// tramite questo menu a scelta fissa offerto dal frontend nel contesto
// "Collegio sindacale" — non si tocca `valori_ammessi` di A28 nel
// catalogo condiviso (contaminerebbe altri usi futuri del motore
// incarichi). Per questo il codice/etichetta vive qui, non nel catalogo.
export const CARICHE_COLLEGIO_SINDACALE: { codice: string; etichetta: string }[] = [
  { codice: "PRESIDENTE", etichetta: "Presidente" },
  { codice: "SINDACO_EFFETTIVO", etichetta: "Sindaco effettivo" },
  { codice: "SINDACO_SUPPLENTE", etichetta: "Sindaco supplente" },
];

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
  caricheDisponibili,
  caricaPredefinita,
  ruoloIdPredefinito,
  tipoTitolare,
}: {
  trigger: ReactNode;
  // Ruoli selezionabili in creazione (es. Amministratore/Amministratore
  // Delegato/Componente CdA per la card "Amministratori"). In modifica il
  // ruolo dell'incarico esistente resta fisso.
  ruoli: RuoloSummary[];
  incarico?: Incarico;
  onSaved: () => void;
  // § Correzione 14: solo per la card Sindaci quando l'assetto è "Collegio
  // sindacale" — mostra il selettore dedicato "Carica" (scrive in
  // `valori.A28`, obbligatorio) al posto del rendering generico di A28 tra
  // "altri campi del ruolo". Assente per ogni altro chiamante (Soci,
  // Amministratori, le altre configurazioni dell'organo di controllo).
  caricheDisponibili?: { codice: string; etichetta: string }[];
  // Preimpostano e bloccano carica/ruolo quando il dialogo si apre dal
  // "+" di una riga segnaposto già associata a una carica specifica (§
  // Correzione 14, "predisposizione visuale delle righe").
  caricaPredefinita?: string;
  ruoloIdPredefinito?: string;
  // § Correzione 16: solo per la card Sindaci quando l'assetto è "Società
  // di revisione legale" — mostra `PersonaGiuridicaPicker` al posto di
  // `PersonaPicker` e scrive `persona_giuridica_id` invece di
  // `persona_id`. Assente (persona fisica, comportamento invariato) per
  // ogni altro chiamante.
  tipoTitolare?: "GIURIDICA";
}) {
  const [open, setOpen] = useState(false);
  const [personaFisica, setPersonaFisica] = useState<PersonaLike | AnaPersona | null>(
    tipoTitolare === "GIURIDICA" ? null : (incarico?.persona ?? null),
  );
  const [personaGiuridica, setPersonaGiuridica] = useState<PersonaGiuridicaLike | AnaPersonaGiuridica | null>(
    tipoTitolare === "GIURIDICA" ? (incarico?.persona_giuridica ?? null) : null,
  );
  const persona = tipoTitolare === "GIURIDICA" ? personaGiuridica : personaFisica;
  const [ruoloId, setRuoloId] = useState<string>(incarico?.ruolo_id ?? ruoloIdPredefinito ?? ruoli[0]?.id ?? "");
  const [caratteristiche, setCaratteristiche] = useState<{ principali: CaratteristicaRuolo[]; altre: CaratteristicaRuolo[] } | null>(
    null,
  );
  const [mostraAltre, setMostraAltre] = useState(false);
  const [valori, setValori] = useState<Record<string, ValoreIncarico>>(
    incarico?.valori ?? (caricaPredefinita ? { A28: caricaPredefinita } : {}),
  );
  const [note, setNote] = useState(incarico?.note ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  // § Correzione 13: quando `creaIncarico` segnala che c'è già un sindaco
  // unico attivo, il dialogo mostra questo messaggio al posto del form —
  // "Conferma sostituzione" ripete la stessa creazione con il flag di
  // conferma (il backend cessa il precedente e crea il nuovo incarico
  // nella stessa transazione), "Annulla" torna al form senza inviare nulla.
  // `tipo` (§ Correzione 15) distingue solo quale flag passare a
  // `creaIncarico` al conferma — stesso identico testo/schermata per
  // entrambi i casi (Sindaco unico/Revisore legale persona fisica), quindi
  // un solo stato generico invece di duplicarlo come per
  // `confermaSostituzioneCarica` sotto (lì la UI è materialmente diversa,
  // un elenco di titolari da scegliere, non un semplice messaggio).
  const [confermaSostituzione, setConfermaSostituzione] = useState<{
    messaggio: string;
    tipo: "sindaco_unico" | "revisore_legale" | "societa_revisione";
  } | null>(null);
  // § Correzione 14: stesso pattern, ma per una carica del collegio
  // sindacale già al completo — qui più persone possono già occuparla,
  // quindi l'utente sceglie ESPLICITAMENTE chi sostituire tra i titolari
  // elencati (decisione esplicita, mai "il primo trovato").
  const [confermaSostituzioneCarica, setConfermaSostituzioneCarica] = useState<{
    messaggio: string;
    titolari: TitolareCaricaCollegio[];
  } | null>(null);
  const [titolareDaSostituire, setTitolareDaSostituire] = useState<string | null>(null);

  const ruoloSelezionato = useMemo(() => ruoli.find((r) => r.id === ruoloId), [ruoli, ruoloId]);

  // § Correzione 16: costruisce la sola metà del payload relativa al
  // titolare (esattamente uno dei due campi, mai entrambi) — evita di
  // ripetere la scelta persona_id/persona_giuridica_id nei tre punti che
  // costruiscono un payload (invio normale, conferma sostituzione,
  // conferma sostituzione carica).
  function titolarePayload(): { persona_id?: string; persona_giuridica_id?: string } {
    if (!persona) return {};
    return tipoTitolare === "GIURIDICA" ? { persona_giuridica_id: persona.id } : { persona_id: persona.id };
  }

  useEffect(() => {
    if (!open || !ruoloId) return;
    setCaratteristiche(null);
    setMostraAltre(false);
    const codiceRuolo = ruoloSelezionato?.codice ?? "";
    getCaratteristicheRuolo(ruoloId)
      .then((tutte) => {
        const separate = separaCaratteristicheCciaa(codiceRuolo, tutte);
        // § Correzione 14: A28 ha già un rendering dedicato (il selettore
        // "Carica" sotto) quando `caricheDisponibili` è passato — evita di
        // mostrarla una seconda volta tra "altri campi del ruolo".
        setCaratteristiche(
          caricheDisponibili
            ? { ...separate, altre: separate.altre.filter((c) => c.codice !== "A28") }
            : separate,
        );
      })
      .catch(() => setCaratteristiche({ principali: [], altre: [] }));
  }, [open, ruoloId, ruoloSelezionato, caricheDisponibili]);

  async function onSubmit() {
    if (!persona) {
      setErrore(tipoTitolare === "GIURIDICA" ? "Seleziona o crea una società." : "Seleziona o crea una persona.");
      return;
    }
    if (!ruoloId) {
      setErrore("Seleziona un ruolo.");
      return;
    }
    if (caricheDisponibili && !valori.A28) {
      setErrore("Seleziona la carica.");
      return;
    }
    setSalvando(true);
    setErrore(null);
    const payload = { ...titolarePayload(), ruolo_id: ruoloId, note: note || null, valori };
    const esito = incarico ? await aggiornaIncarico(incarico.id, payload) : await creaIncarico(payload);
    setSalvando(false);
    if (esito.esito === "ok") {
      setOpen(false);
      onSaved();
    } else if (esito.esito === "conferma_sostituzione_sindaco_unico") {
      setConfermaSostituzione({ messaggio: esito.messaggio, tipo: "sindaco_unico" });
    } else if (esito.esito === "conferma_sostituzione_revisore_legale") {
      setConfermaSostituzione({ messaggio: esito.messaggio, tipo: "revisore_legale" });
    } else if (esito.esito === "conferma_sostituzione_societa_revisione") {
      setConfermaSostituzione({ messaggio: esito.messaggio, tipo: "societa_revisione" });
    } else if (esito.esito === "conferma_sostituzione_carica_collegio") {
      setConfermaSostituzioneCarica({ messaggio: esito.messaggio, titolari: esito.titolari });
      setTitolareDaSostituire(esito.titolari[0]?.id ?? null);
    } else {
      setErrore(esito.messaggio);
    }
  }

  async function onConfermaSostituzione() {
    if (!persona || !ruoloId || !confermaSostituzione) return;
    setSalvando(true);
    setErrore(null);
    const payload = { ...titolarePayload(), ruolo_id: ruoloId, note: note || null, valori };
    const opts =
      confermaSostituzione.tipo === "sindaco_unico"
        ? { confermaSostituzioneSindacoUnico: true }
        : confermaSostituzione.tipo === "revisore_legale"
          ? { confermaSostituzioneRevisoreLegale: true }
          : { confermaSostituzioneSocietaRevisione: true };
    const esito = await creaIncarico(payload, opts);
    setSalvando(false);
    if (esito.esito === "ok") {
      setConfermaSostituzione(null);
      setOpen(false);
      onSaved();
    } else if (esito.esito === "errore") {
      setConfermaSostituzione(null);
      setErrore(esito.messaggio);
    }
  }

  async function onConfermaSostituzioneCarica() {
    if (!persona || !ruoloId || !titolareDaSostituire) return;
    setSalvando(true);
    setErrore(null);
    const payload = { ...titolarePayload(), ruolo_id: ruoloId, note: note || null, valori };
    const esito = await creaIncarico(payload, { sostituisciIncaricoId: titolareDaSostituire });
    setSalvando(false);
    if (esito.esito === "ok") {
      setConfermaSostituzioneCarica(null);
      setOpen(false);
      onSaved();
    } else if (esito.esito === "errore") {
      setConfermaSostituzioneCarica(null);
      setErrore(esito.messaggio);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        // Il dialogo resta montato tra un'apertura e l'altra (stesso
        // pattern già in uso per gli altri stati del form): senza questo
        // reset, riaprendolo dopo una sostituzione annullata mostrerebbe
        // di nuovo la schermata di conferma invece del form.
        if (!nextOpen) {
          setConfermaSostituzione(null);
          setConfermaSostituzioneCarica(null);
          setTitolareDaSostituire(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{incarico ? "Modifica incarico" : "Nuovo incarico"}</DialogTitle>
        </DialogHeader>

        {confermaSostituzioneCarica !== null ? (
          // § Correzione 14: come `confermaSostituzione` sopra, ma con un
          // titolare da scegliere esplicitamente (più persone possono già
          // occupare la stessa carica del collegio sindacale).
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--az-ink)]">{confermaSostituzioneCarica.messaggio}</p>
            <div className="flex flex-col gap-2">
              {confermaSostituzioneCarica.titolari.map((titolare) => (
                <label key={titolare.id} className="flex items-center gap-2 text-sm text-[var(--az-ink)]">
                  <input
                    type="radio"
                    name="titolare-da-sostituire"
                    value={titolare.id}
                    checked={titolareDaSostituire === titolare.id}
                    onChange={() => setTitolareDaSostituire(titolare.id)}
                  />
                  {titolare.nome}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfermaSostituzioneCarica(null)}
                disabled={salvando}
              >
                Annulla
              </Button>
              <Button type="button" onClick={onConfermaSostituzioneCarica} disabled={salvando || !titolareDaSostituire}>
                {salvando ? "Salvataggio…" : "Conferma sostituzione"}
              </Button>
            </div>
          </div>
        ) : confermaSostituzione !== null ? (
          // § Correzione 13/15/16: sostituisce il form finché l'utente non
          // decide — "Annulla" torna al form senza inviare nulla (la
          // bozza compilata resta intatta), "Conferma sostituzione" cessa
          // il sindaco unico/revisore legale/società di revisione
          // esistente e crea questo nuovo incarico nella stessa
          // transazione.
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--az-ink)]">{confermaSostituzione.messaggio}</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfermaSostituzione(null)} disabled={salvando}>
                Annulla
              </Button>
              <Button type="button" onClick={onConfermaSostituzione} disabled={salvando}>
                {salvando ? "Salvataggio…" : "Conferma sostituzione"}
              </Button>
            </div>
          </div>
        ) : (
        <div className="flex flex-col gap-4">
          <FormError message={errore ?? undefined} />

          <div className="flex flex-col gap-1.5">
            <Label>{tipoTitolare === "GIURIDICA" ? "Società" : "Persona"}</Label>
            {tipoTitolare === "GIURIDICA" ? (
              <PersonaGiuridicaPicker value={personaGiuridica} onChange={setPersonaGiuridica} />
            ) : (
              <PersonaPicker value={personaFisica} onChange={setPersonaFisica} />
            )}
          </div>

          {ruoli.length > 1 && !incarico && !ruoloIdPredefinito && (
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
          {!incarico && ruoloIdPredefinito && ruoli.length > 1 && ruoloSelezionato && (
            <p className="text-sm text-muted-foreground">Ruolo: {ruoloSelezionato.denominazione}</p>
          )}

          {caricheDisponibili && (
            <div className="flex flex-col gap-1.5">
              <Label>Carica</Label>
              <Select
                value={typeof valori.A28 === "string" ? valori.A28 : ""}
                onValueChange={(v) => setValori((prev) => ({ ...prev, A28: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona la carica…" />
                </SelectTrigger>
                <SelectContent>
                  {caricheDisponibili.map((c) => (
                    <SelectItem key={c.codice} value={c.codice}>
                      {c.etichetta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
        )}
      </DialogContent>
    </Dialog>
  );
}
