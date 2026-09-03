"use client";

import { ChevronDownIcon, EyeIcon, GitCompareIcon, HistoryIcon, PencilIcon, RefreshCwIcon } from "lucide-react";
import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";

import { DeleteButton } from "@/components/delete-button";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiResource } from "@/lib/actions/api-resource";
import { formatDate } from "@/lib/format";
import { etichettaPeriodo, etichettaRilevazione, formatPercentualeVisiva, numeroPersone } from "@/lib/personale-occupazione-format";
import type { AddettiVisura, GruppoCalcolato, PersonaleOccupazioneRiepilogo } from "@/lib/types/anagrafica";
import { cn } from "@/lib/utils";

import { deleteAddettiVisura } from "../addetti-visura/actions";
import { AddettiVisuraDialog } from "../addetti-visura/addetti-visura-dialog";
import { getRiepilogoPersonaleOccupazione, getStoricoRilevazioni } from "./actions";

type Stato =
  | { fase: "loading" }
  | { fase: "error" }
  | { fase: "ok"; elenco: PersonaleOccupazioneRiepilogo[]; rilevazioniComplete: Record<string, AddettiVisura> };

/** Storico delle rilevazioni di "Addetti da visura" (§ riorganizzazione
 * richiesta esplicitamente, distinta dalla "Rilevazione più recente" mai
 * toccata qui): sola consultazione delle fotografie precedenti — mai la
 * stessa rilevazione mostrata sopra, mai ricostruita con valori correnti
 * (ogni voce riusa `_costruisci_riepilogo` lato backend per la propria
 * fotografia, § app/core/personale_occupazione.py).
 *
 * Nessun collegamento a una "visura di origine"/documento importato: lo
 * schema attuale (`ana_addetti_visura`) non ha alcun campo che leghi una
 * rilevazione a un documento o a un'importazione CCIAA (il modulo
 * Documenti è un placeholder, § CLAUDE.md) — l'azione "Apri visura di
 * origine" prevista dalla richiesta non viene quindi mai mostrata, mai un
 * pulsante disattivato a vuoto. Allo stesso modo non esiste un campo che
 * distingua una rilevazione "importata da CCIAA" da una inserita
 * manualmente: tutte le rilevazioni oggi nascono dallo stesso form
 * manuale (nessuna pipeline di importazione automatica esiste), quindi le
 * azioni Modifica/Elimina restano quelle già esistenti in piattaforma
 * (riservate al consulente, mai un nuovo sistema di permessi) invece di
 * essere rimosse in base a una distinzione che i dati non permettono di
 * ricostruire — entrambe le lacune sono segnalate nel riepilogo di fine
 * sessione, non inventate qui.
 *
 * `editing` arriva da `PersonaleOccupazionePanel` (§ banner in fondo alla
 * sezione): Modifica/Elimina per riga compaiono solo in modalità modifica
 * — Visualizza dettaglio e Confronta restano sempre disponibili, sono
 * sola consultazione. "+ Nuova rilevazione" si è spostato in testa alla
 * sezione, sulla riga di "Rilevazione più recente" (§ richiesta esplicita
 * successiva), non vive più qui.
 *
 * Nessuna colonna di stato in tabella né nel dettaglio (§ richiesta
 * esplicita: "finiranno rilevazioni già confermate", non è
 * un'informazione utile per distinguere le righe storiche tra loro) — lo
 * stato resta comunque storicizzato lato backend per ciascuna rilevazione
 * (§ app/core/personale_occupazione.py), riusabile se servirà mostrarlo
 * in futuro. */
export function StoricoRilevazioni({
  editing,
  stackedMode = false,
}: {
  editing: boolean;
  // § Correzione 27/28: vero solo quando impilata in "Dati camerali
  // completi" (§ commento analogo in `RiepilogoPersonaleOccupazione`) —
  // elimina il border-b di questo blocco.
  stackedMode?: boolean;
}) {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const [aperto, setAperto] = useState(false);
  const [stato, setStato] = useState<Stato>({ fase: "loading" });
  const [rigaEspansa, setRigaEspansa] = useState<string | null>(null);
  const [confronto, setConfronto] = useState<PersonaleOccupazioneRiepilogo | null>(null);
  const [ultima, setUltima] = useState<PersonaleOccupazioneRiepilogo | null>(null);
  const [dialogoModificaId, setDialogoModificaId] = useState<string | null>(null);

  const carica = useCallback(() => {
    setStato({ fase: "loading" });
    Promise.all([
      getStoricoRilevazioni(),
      getApiResource<AddettiVisura[]>("/api/anagrafica/addetti-visura"),
      getRiepilogoPersonaleOccupazione(),
    ])
      .then(([elenco, rilevazioni, riepilogoUltima]) => {
        const rilevazioniComplete: Record<string, AddettiVisura> = {};
        for (const r of rilevazioni) rilevazioniComplete[r.id] = r;
        setUltima(riepilogoUltima);
        setStato({ fase: "ok", elenco, rilevazioniComplete });
      })
      .catch(() => setStato({ fase: "error" }));
  }, []);

  // § punto 4: il conteggio delle rilevazioni precedenti fa parte
  // dell'intestazione comprimibile stessa ("3 rilevazioni precedenti"),
  // quindi va caricato subito — non solo quando il blocco viene aperto.
  useEffect(() => {
    carica();
  }, [carica]);

  const conteggio = stato.fase === "ok" ? stato.elenco.length : null;
  const etichettaConteggio =
    conteggio === null
      ? ""
      : conteggio === 0
        ? "Nessuna rilevazione precedente"
        : `${conteggio} ${conteggio === 1 ? "rilevazione precedente" : "rilevazioni precedenti"}`;

  async function elimina(id: string, formData: FormData) {
    await deleteAddettiVisura(id, formData);
    carica();
  }

  const rilevazioneInModifica =
    stato.fase === "ok" && dialogoModificaId ? stato.rilevazioniComplete[dialogoModificaId] : undefined;

  return (
    <div className={cn("py-6", !stackedMode && "border-b border-[var(--az-border)] last:border-b-0")}>
      <button
        type="button"
        onClick={() => setAperto((v) => !v)}
        aria-expanded={aperto}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="inline-flex min-w-0 items-center gap-2 text-[13px] font-bold text-[var(--az-blue)]">
          <HistoryIcon className="size-4 shrink-0" />
          <span>Storico rilevazioni — Addetti da visura</span>
          {conteggio !== null && <span className="font-normal text-[var(--az-muted)]">{etichettaConteggio}</span>}
        </span>
        <ChevronDownIcon
          className={cn("size-4 shrink-0 text-[var(--az-blue)] transition-transform", !aperto && "-rotate-90")}
        />
      </button>

      {aperto && (
        <div className="mt-4">
          {stato.fase === "loading" && (
            <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-busy="true">
              {[0, 1].map((i) => (
                <span key={i} className="az-skeleton h-9 w-full" />
              ))}
            </div>
          )}

          {stato.fase === "error" && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <span>Impossibile caricare lo storico delle rilevazioni.</span>
              <button type="button" onClick={carica} className="font-semibold underline">
                Riprova
              </button>
            </div>
          )}

          {stato.fase === "ok" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-[13px] font-bold text-[var(--az-ink)]">
                  Rilevazioni precedenti <span className="font-normal text-[var(--az-muted)]">({stato.elenco.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={carica}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]"
                >
                  <RefreshCwIcon className="size-3.5" />
                  Aggiorna
                </button>
              </div>

              {stato.elenco.length === 0 ? (
                <div className="rounded-md border border-[var(--az-border)] bg-[#f7faff] px-4 py-5 text-center">
                  <p className="text-sm font-medium text-[var(--az-ink)]">Non sono ancora disponibili rilevazioni storiche.</p>
                  <p className="mt-1 text-xs text-[var(--az-muted)]">
                    Le rilevazioni precedenti compariranno dopo l&apos;acquisizione di nuovi dati da una visura successiva.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-10 bg-[#fbfcff]">Anno</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Data rilevazione</TableHead>
                      <TableHead>Addetti totali</TableHead>
                      <TableHead className="w-12 text-center">Confronto</TableHead>
                      <TableHead className="w-24">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stato.elenco.map((r) => {
                      const id = r.rilevazione_id as string;
                      const rigaCompleta = stato.rilevazioniComplete[id];
                      const espansa = rigaEspansa === id;
                      return (
                        <Fragment key={id}>
                          <TableRow aria-expanded={espansa}>
                            <TableCell className="sticky left-0 z-10 bg-white font-medium">
                              {r.anno_riferimento ?? "—"}
                            </TableCell>
                            <TableCell>{etichettaPeriodo(r.periodo)}</TableCell>
                            <TableCell>{formatDate(r.data_rilevazione)}</TableCell>
                            <TableCell>{numeroPersone(r.addetti_totali)}</TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                onClick={() => setConfronto(r)}
                                aria-label="Confronta con l'ultima rilevazione"
                                title="Confronta con l'ultima rilevazione"
                                className="grid size-7 place-items-center rounded-md text-[var(--az-blue)] hover:bg-[#f1f6ff]"
                              >
                                <GitCompareIcon className="size-4" />
                              </button>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setRigaEspansa(espansa ? null : id)}
                                  aria-expanded={espansa}
                                  aria-label={espansa ? "Chiudi dettaglio" : "Visualizza dettaglio"}
                                  title={espansa ? "Chiudi dettaglio" : "Visualizza dettaglio"}
                                  className="grid size-7 place-items-center rounded-md text-[var(--az-blue)] hover:bg-[#f1f6ff]"
                                >
                                  <EyeIcon className="size-4" />
                                </button>
                                {consulente && editing && rigaCompleta && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setDialogoModificaId(id)}
                                      aria-label="Modifica rilevazione"
                                      title="Modifica rilevazione"
                                      className="grid size-7 place-items-center rounded-md text-[var(--az-blue)] hover:bg-[#f1f6ff]"
                                    >
                                      <PencilIcon className="size-4" />
                                    </button>
                                    <DeleteButton
                                      action={elimina.bind(null, id)}
                                      confirmMessage={`Eliminare la rilevazione "${etichettaRilevazione(r.periodo, r.anno_riferimento, r.data_rilevazione)}"?`}
                                    />
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {espansa && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-[#f7faff] p-4">
                                <DettaglioStorico riepilogo={r} />
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      )}

      {stato.fase === "ok" && (
        <ConfrontoDialog
          storica={confronto}
          recente={ultima}
          onOpenChange={(open) => !open && setConfronto(null)}
        />
      )}

      {rilevazioneInModifica && (
        <AddettiVisuraDialog
          dati={rilevazioneInModifica}
          open={dialogoModificaId !== null}
          onOpenChange={(open) => !open && setDialogoModificaId(null)}
          onSaved={carica}
          trigger={<span className="hidden" />}
        />
      )}
    </div>
  );
}

function CampoCompatto({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-[var(--az-border)] bg-white px-2.5 py-1.5 text-xs">
      <span className="text-[var(--az-muted)]">{label}</span>
      <span className="font-semibold text-[var(--az-ink)]">{value}</span>
    </div>
  );
}

function BloccoCompatto({ titolo, campi }: { titolo: string; campi: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold tracking-wide text-[var(--az-ink-soft)] uppercase">{titolo}</span>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {campi.map((c) => (
          <CampoCompatto key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}

/** Dettaglio compatto (§ punto 14: "non ripetere le grandi card con
 * grafici circolari"): stessi raggruppamenti della rilevazione più
 * recente, in forma di elenco di campi invece di anelli. */
function DettaglioStorico({ riepilogo: r }: { riepilogo: PersonaleOccupazioneRiepilogo }) {
  const ambito = [r.territorio.comune, r.territorio.provincia].filter(Boolean).join(" (") + (r.territorio.provincia ? ")" : "");
  const haTerritorio = r.territorio.comune !== null;

  function campiGruppo(gruppo: GruppoCalcolato, chiavi: { chiave: string; label: string }[]) {
    return chiavi.map(({ chiave, label }) => ({
      label,
      value: `${formatPercentualeVisiva(gruppo.percentuali[chiave])} · ${gruppo.numeri[chiave] !== null ? `${numeroPersone(gruppo.numeri[chiave])} persone` : "n/d"}`,
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      <BloccoCompatto
        titolo="Dati della rilevazione"
        campi={[
          { label: "Anno", value: r.anno_riferimento?.toString() ?? "—" },
          { label: "Periodo", value: etichettaPeriodo(r.periodo) },
          { label: "Data di rilevazione", value: formatDate(r.data_rilevazione) },
          { label: "Fonte", value: r.fonte ?? "—" },
          ...(haTerritorio ? [{ label: "Ambito territoriale", value: ambito }] : []),
        ]}
      />
      <BloccoCompatto
        titolo="Consistenza del personale"
        campi={[
          { label: "Addetti totali", value: numeroPersone(r.addetti_totali) },
          { label: "Dipendenti", value: numeroPersone(r.dipendenti) },
          { label: "Indipendenti", value: numeroPersone(r.indipendenti) },
          { label: "Collaboratori", value: numeroPersone(r.collaboratori) },
        ]}
      />
      <BloccoCompatto
        titolo="Distribuzione per tipologia contrattuale"
        campi={campiGruppo(r.tipologia_contrattuale, [
          { chiave: "tempo_determinato", label: "Tempo determinato" },
          { chiave: "tempo_indeterminato", label: "Tempo indeterminato" },
        ])}
      />
      <BloccoCompatto
        titolo="Distribuzione per orario di lavoro"
        campi={campiGruppo(r.orario_lavoro, [
          { chiave: "tempo_pieno", label: "Tempo pieno" },
          { chiave: "tempo_parziale", label: "Tempo parziale" },
        ])}
      />
      <BloccoCompatto
        titolo="Distribuzione per inquadramento"
        campi={campiGruppo(r.inquadramento, [
          { chiave: "apprendisti", label: "Apprendisti" },
          { chiave: "operai", label: "Operai" },
          { chiave: "impiegati", label: "Impiegati" },
        ])}
      />
      {haTerritorio && (
        <BloccoCompatto
          titolo="Distribuzione territoriale"
          campi={[
            { label: "Dipendenti nel comune", value: numeroPersone(r.territorio.dipendenti_nel_comune) },
            { label: "Indipendenti nel comune", value: numeroPersone(r.territorio.indipendenti_nel_comune) },
            { label: "Addetti totali nel comune", value: numeroPersone(r.territorio.addetti_totali_nel_comune) },
          ]}
        />
      )}
    </div>
  );
}

/** Variazione tra due valori assoluti o due percentuali (§ punto 17/18):
 * colori neutrali (blu se c'è una variazione, grigio se nessuna), mai
 * verde/rosso — un aumento o una diminuzione non è di per sé un giudizio. */
function celleVariazione(storico: number | null, recente: number | null, unita: "persone" | "punti"): ReactNode {
  if (storico === null || recente === null) {
    return <span className="text-xs text-[var(--az-muted)]">Confronto non disponibile</span>;
  }
  const delta = Math.round((recente - storico) * 10) / 10;
  if (delta === 0) {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--az-muted)]">— 0</span>;
  }
  const freccia = delta > 0 ? "↑" : "↓";
  const segno = delta > 0 ? "+" : "−";
  const assoluto = Math.abs(delta);
  const testoUnita = unita === "persone" ? (assoluto === 1 ? "persona" : "persone") : "punti percentuali";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--az-blue)]">
      {freccia} {segno}
      {assoluto} {testoUnita}
    </span>
  );
}

function rigaConfrontoAssoluta(label: string, storico: number | null, recente: number | null) {
  return (
    <TableRow key={label}>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell>{numeroPersone(storico)}</TableCell>
      <TableCell>{numeroPersone(recente)}</TableCell>
      <TableCell>{celleVariazione(storico, recente, "persone")}</TableCell>
    </TableRow>
  );
}

function rigaConfrontoPercentuale(label: string, storico: string | null, recente: string | null) {
  const storicoNum = storico === null ? null : Number(storico);
  const recenteNum = recente === null ? null : Number(recente);
  return (
    <TableRow key={label}>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell>{formatPercentualeVisiva(storico)}</TableCell>
      <TableCell>{formatPercentualeVisiva(recente)}</TableCell>
      <TableCell>{celleVariazione(storicoNum, recenteNum, "punti")}</TableCell>
    </TableRow>
  );
}

/** Confronto tra una rilevazione storica e la rilevazione più recente (§
 * punto 15/16): sempre esattamente queste due, mai una selezione libera di
 * periodi (§ punto 25, esplicitamente escluso in questa fase). */
function ConfrontoDialog({
  storica,
  recente,
  onOpenChange,
}: {
  storica: PersonaleOccupazioneRiepilogo | null;
  recente: PersonaleOccupazioneRiepilogo | null;
  onOpenChange: (open: boolean) => void;
}) {
  const aperto = storica !== null && recente !== null;
  const haTerritorioEntrambi = storica?.territorio.comune !== null && recente?.territorio.comune !== null;

  return (
    <Dialog open={aperto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Confronto rilevazioni</DialogTitle>
          {storica && recente && (
            <p className="text-sm text-muted-foreground">
              {etichettaRilevazione(storica.periodo, storica.anno_riferimento, storica.data_rilevazione)}
              {" → "}
              {etichettaRilevazione(recente.periodo, recente.anno_riferimento, recente.data_rilevazione)}
            </p>
          )}
        </DialogHeader>
        {storica && recente && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicatore</TableHead>
                <TableHead>
                  {etichettaRilevazione(storica.periodo, storica.anno_riferimento, storica.data_rilevazione)}
                </TableHead>
                <TableHead>
                  {etichettaRilevazione(recente.periodo, recente.anno_riferimento, recente.data_rilevazione)}
                </TableHead>
                <TableHead>Variazione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rigaConfrontoAssoluta("Addetti totali", storica.addetti_totali, recente.addetti_totali)}
              {rigaConfrontoAssoluta("Dipendenti", storica.dipendenti, recente.dipendenti)}
              {rigaConfrontoAssoluta("Indipendenti", storica.indipendenti, recente.indipendenti)}
              {rigaConfrontoAssoluta("Collaboratori", storica.collaboratori, recente.collaboratori)}

              {rigaConfrontoPercentuale(
                "Tempo determinato",
                storica.tipologia_contrattuale.percentuali.tempo_determinato,
                recente.tipologia_contrattuale.percentuali.tempo_determinato,
              )}
              {rigaConfrontoPercentuale(
                "Tempo indeterminato",
                storica.tipologia_contrattuale.percentuali.tempo_indeterminato,
                recente.tipologia_contrattuale.percentuali.tempo_indeterminato,
              )}

              {rigaConfrontoPercentuale(
                "Tempo pieno",
                storica.orario_lavoro.percentuali.tempo_pieno,
                recente.orario_lavoro.percentuali.tempo_pieno,
              )}
              {rigaConfrontoPercentuale(
                "Tempo parziale",
                storica.orario_lavoro.percentuali.tempo_parziale,
                recente.orario_lavoro.percentuali.tempo_parziale,
              )}

              {rigaConfrontoPercentuale(
                "Apprendisti",
                storica.inquadramento.percentuali.apprendisti,
                recente.inquadramento.percentuali.apprendisti,
              )}
              {rigaConfrontoPercentuale(
                "Operai",
                storica.inquadramento.percentuali.operai,
                recente.inquadramento.percentuali.operai,
              )}
              {rigaConfrontoPercentuale(
                "Impiegati",
                storica.inquadramento.percentuali.impiegati,
                recente.inquadramento.percentuali.impiegati,
              )}

              {haTerritorioEntrambi && (
                <>
                  {rigaConfrontoAssoluta(
                    "Dipendenti nel comune",
                    storica.territorio.dipendenti_nel_comune,
                    recente.territorio.dipendenti_nel_comune,
                  )}
                  {rigaConfrontoAssoluta(
                    "Indipendenti nel comune",
                    storica.territorio.indipendenti_nel_comune,
                    recente.territorio.indipendenti_nel_comune,
                  )}
                  {rigaConfrontoAssoluta(
                    "Addetti totali nel comune",
                    storica.territorio.addetti_totali_nel_comune,
                    recente.territorio.addetti_totali_nel_comune,
                  )}
                </>
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
