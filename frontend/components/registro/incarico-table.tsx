"use client";

import { PencilIcon, PlusIcon, Trash2Icon, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Button } from "@/components/ui/button";
import { CARICHE_COLLEGIO_SINDACALE, IncaricoFormDialog } from "@/components/registro/incarico-form-dialog";
import { IncaricoVerificationPopover } from "@/components/registro/incarico-verification-popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { eliminaIncarico, getIncarichi, getRuoli } from "@/lib/actions/personale";
import { formatCurrency, formatDate, formatDecimal } from "@/lib/format";
import type { Incarico, RuoloSummary } from "@/lib/types/personale";

// § Correzione 14: etichetta di "Carica" per la colonna della tabella —
// A28, quando compilata (solo per un incarico SINDACO nel "Collegio
// sindacale"), altrimenti il comportamento invariato di sempre (nome del
// ruolo, es. "Amministratore" o "Sindaco").
const ETICHETTE_CARICA_COLLEGIO: Record<string, string> = Object.fromEntries(
  CARICHE_COLLEGIO_SINDACALE.map((c) => [c.codice, c.etichetta]),
);

function etichettaCarica(incarico: Incarico): string {
  // § Correzione 16: "La carica deve essere: Società di revisione legale"
  // (§ testo esplicito) — un'etichetta fissa per il titolare persona
  // giuridica, non il nome del ruolo (che qui resterebbe "Revisore
  // Legale", lo stesso ruolo condiviso col titolare persona fisica).
  if (incarico.persona_giuridica) return "Società di revisione legale";
  const carica = valoreCaratteristica(incarico, "A28");
  return (carica && ETICHETTE_CARICA_COLLEGIO[carica]) || incarico.ruolo.denominazione;
}

// § Correzione 16: nome/identificativo del titolare, qualunque sia il tipo
// (persona fisica o giuridica) — evita di ripetere il controllo
// `incarico.persona ?? incarico.persona_giuridica` in ogni punto che ne ha
// bisogno (conferma di eliminazione, popover di verifica).
function nomeTitolare(incarico: Incarico): string {
  if (incarico.persona) return `${incarico.persona.cognome} ${incarico.persona.nome}`;
  if (incarico.persona_giuridica) return incarico.persona_giuridica.denominazione;
  return "—";
}

/** Cella "Persona" della tabella, per entrambi i tipi di titolare (§
 * Correzione 16): persona fisica (cognome+nome, CF sotto) o persona
 * giuridica (denominazione, CF sotto) — stesso layout in entrambi i casi. */
function CellaTitolare({ incarico }: { incarico: Incarico }) {
  if (incarico.persona) {
    return (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">
          {incarico.persona.cognome} {incarico.persona.nome}
        </span>
        <span className="text-xs text-muted-foreground">{incarico.persona.codice_fiscale}</span>
      </div>
    );
  }
  if (incarico.persona_giuridica) {
    return (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{incarico.persona_giuridica.denominazione}</span>
        <span className="text-xs text-muted-foreground">{incarico.persona_giuridica.codice_fiscale}</span>
      </div>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}

// § Correzione 14: quanti posti prescrive la composizione del collegio
// sindacale per ciascuna carica — Presidente e Sindaco supplente sono
// fissi, Sindaco effettivo dipende dalla scelta "Sindaci effettivi" (3 o
// 5) fatta nella sezione. `null` = non ancora determinabile (scelta non
// ancora fatta), stesso significato di `sindaciEffettivi: null`.
function capCaricaCollegio(codice: string, sindaciEffettivi: number | null): number | null {
  if (codice === "PRESIDENTE") return 1;
  if (codice === "SINDACO_SUPPLENTE") return 2;
  if (codice === "SINDACO_EFFETTIVO") return sindaciEffettivi !== null ? Math.max(sindaciEffettivi - 1, 0) : null;
  return null;
}

/** Prima data valorizzata tra quelle candidate, nell'ordine indicato — usata
 * per mostrare "Data di nomina" qualunque sia la caratteristica realmente
 * compilata per il ruolo (A49 per amministratori/sindaci, A01 per soci). */
function primaData(incarico: Incarico, codici: string[]): string {
  for (const codice of codici) {
    const valore = incarico.valori[codice];
    if (typeof valore === "string" && valore) return formatDate(valore);
  }
  return "—";
}

function valoreCaratteristica(incarico: Incarico, codice: string): string | null {
  const valore = incarico.valori[codice];
  return typeof valore === "string" && valore ? valore : null;
}

function formatPercentuale(valore: string | null): string {
  return valore ? `${formatDecimal(valore)}%` : "—";
}

/** Tabella incorporata Soci/Amministratori/Sindaci (§4/§5/§6 della specifica
 * CCIAA): sopra il motore generico `per_incarichi` già esistente, filtrata
 * per i soli ruoli pertinenti alla card. Nessuna riga inventata: se il
 * ruolo non ha ancora incarichi registrati, la tabella è semplicemente
 * vuota, non un placeholder statico. */
export function IncaricoTable({
  titolo,
  icon,
  ruoliCodici,
  etichettaVuoto,
  sectionKey,
  variante,
  addRowLabel = "Aggiungi",
  collegioSindacale,
  tipoTitolare,
}: {
  titolo: string;
  icon: LucideIcon;
  ruoliCodici: string[];
  etichettaVuoto: string;
  // Sezione a registro il cui banner "Modifica dati" governa la modalità
  // modifica della card (la tabella non ne ha una propria — vedi
  // `DataTableCard`). Omesso finché non è stato migrato anche il call site
  // (Amministratori/Sindaci, per ora invariati).
  sectionKey?: string;
  // "soci": vista riepilogativa Correzione 02 (Persona/Ruolo/Data di
  // nomina/Quota/Valore nominale/Versamento/Stato di carica/Verifica,
  // colonna azioni solo in modifica) — nascita/cittadinanza/domicilio
  // restano solo nel form completo (pulsante Modifica, in modalità
  // modifica).
  // "cariche": vista riepilogativa Correzione 09 (Persona/Ruolo/Carica/
  // Data di nomina/Durata/Stato della carica/Verifica), usata sia da
  // Amministratori sia — stessa richiesta, stesso giorno — da Sindaci:
  // stessa struttura per tutte e 4 le configurazioni dell'organo
  // amministrativo e per tutte le configurazioni dell'organo di controllo
  // (solo il titolo della tabella cambia, vedi TITOLO_TABELLA_AMMINISTRATORI
  // in cciaa-section-panel.tsx per Amministratori, titolo fisso per
  // Sindaci). "Carica" mostra lo stesso valore di "Ruolo"
  // (incarico.ruolo.denominazione): decisione esplicita dell'utente, non
  // esiste in piattaforma un campo distinto per la carica specifica
  // (Presidente/Consigliere/Sindaco effettivo...) e non se ne crea uno
  // nuovo per questa correzione. Colonna azioni sempre visibile, non
  // gated dalla modifica scheda: invariato rispetto al comportamento
  // precedente di queste due card (mai stato esteso il gating di
  // Correzione 02, § quella correzione, "non generalizzare senza
  // conferma").
  variante: "soci" | "cariche";
  // Testo del pulsante di inserimento riga, solo per il ramo con
  // `sectionKey` (§ Correzione 05 punto 10: "Aggiungi riga" per la card
  // Amministratori). Default invariato per gli altri chiamanti (Soci).
  addRowLabel?: string;
  // § Correzione 14: solo per la card Sindaci quando l'assetto è "Collegio
  // sindacale" — `sindaciEffettivi` è il valore corrente (bozza se in
  // modifica) del campo omonimo della sezione. Attiva: il selettore
  // "Carica" nel dialogo "Aggiungi riga", il conteggio del titolo secondo
  // la composizione prescritta (non le sole righe già compilate) e le
  // righe segnaposto per i posti ancora non occupati. Assente per ogni
  // altra card/configurazione (Soci, Amministratori, le altre
  // configurazioni dell'organo di controllo).
  collegioSindacale?: { sindaciEffettivi: number | null };
  // § Correzione 16: quando `ruoliCodici` include REVISORE_LEGALE ma la
  // card deve mostrare solo un tipo di titolare (persona fisica per
  // "Revisore legale persona fisica", giuridica per "Società di revisione
  // legale" — stesso ruolo condiviso da entrambe le configurazioni, § nota
  // in cciaa-section-panel.tsx), filtra le righe per tipo di titolare
  // effettivo e passa lo stesso vincolo al dialogo "Aggiungi riga"
  // (`PersonaGiuridicaPicker` invece di `PersonaPicker`). `undefined` per
  // ogni card che mescola i due tipi (Soci, Amministratori, Sindaco
  // unico/Collegio sindacale, tabella generica "Sindaci e revisori").
  tipoTitolare?: "FISICA" | "GIURIDICA";
}) {
  const { ruolo, state } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const editingScheda = sectionKey ? (state.sections[sectionKey]?.editing ?? false) : undefined;
  const [ruoli, setRuoli] = useState<RuoloSummary[] | null>(null);
  const [incarichi, setIncarichi] = useState<Incarico[] | null>(null);
  const [errore, setErrore] = useState(false);

  const carica = useCallback(() => {
    setErrore(false);
    Promise.all([getRuoli(ruoliCodici), getIncarichi()])
      .then(([ruoliLetti, tutti]) => {
        setRuoli(ruoliLetti);
        const codiciSet = new Set(ruoliCodici);
        setIncarichi(tutti.filter((i) => codiciSet.has(i.ruolo.codice)));
      })
      .catch(() => setErrore(true));
  }, [ruoliCodici]);

  useEffect(() => {
    carica();
  }, [carica]);

  async function onElimina(incarico: Incarico) {
    if (!confirm(`Rimuovere l'incarico di ${nomeTitolare(incarico)}?`)) return;
    const esito = await eliminaIncarico(incarico.id);
    if (esito.esito === "ok") carica();
  }

  if (errore) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        <span>Impossibile caricare i dati.</span>
        <button type="button" onClick={carica} className="font-semibold underline">
          Riprova
        </button>
      </div>
    );
  }

  if (ruoli === null || incarichi === null) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-busy="true">
        {[0, 1].map((i) => (
          <span key={i} className="az-skeleton h-9 w-full" />
        ))}
      </div>
    );
  }

  const Icon = icon;
  const caricheOpzioni = collegioSindacale ? CARICHE_COLLEGIO_SINDACALE : undefined;
  // § Correzione 16: solo le righe del tipo di titolare atteso da questa
  // card — vedi il commento su `tipoTitolare` sopra. Righe di un altro
  // tipo (es. un revisore persona fisica storico, mentre l'assetto
  // corrente è "Società di revisione legale") restano nel database, non
  // spariscono: semplicemente non compaiono in QUESTA tabella.
  const incarichiFiltrati =
    tipoTitolare === "GIURIDICA"
      ? incarichi.filter((i) => i.persona_giuridica !== null)
      : tipoTitolare === "FISICA"
        ? incarichi.filter((i) => i.persona !== null)
        : incarichi;
  const addTrigger = sectionKey ? (
    <IncaricoFormDialog
      ruoli={ruoli}
      onSaved={carica}
      caricheDisponibili={caricheOpzioni}
      tipoTitolare={tipoTitolare === "GIURIDICA" ? "GIURIDICA" : undefined}
      trigger={<AddRowButton icon={PlusIcon} label={addRowLabel} />}
    />
  ) : (
    <IncaricoFormDialog ruoli={ruoli} onSaved={carica} trigger={<AddRowButton icon={Icon} />} />
  );

  // § Correzione 14: righe segnaposto per i posti del collegio sindacale
  // ancora non occupati — solo UI, mai righe reali nel database (§
  // decisione esplicita, AskUserQuestion: `PerIncarico.persona_id` NOT
  // NULL rende impossibile crearle davvero). Ognuna apre lo stesso
  // dialogo "Aggiungi riga" con ruolo/carica già preselezionati.
  const ruoloSindaco = collegioSindacale ? ruoli.find((r) => r.codice === "SINDACO") : undefined;
  const segnaposto =
    collegioSindacale && ruoloSindaco
      ? CARICHE_COLLEGIO_SINDACALE.flatMap((c) => {
          const cap = capCaricaCollegio(c.codice, collegioSindacale.sindaciEffettivi);
          if (cap === null) return [];
          const occupati = incarichi.filter(
            (i) => i.ruolo.codice === "SINDACO" && valoreCaratteristica(i, "A28") === c.codice,
          ).length;
          return Array.from({ length: Math.max(cap - occupati, 0) }, (_, idx) => ({ carica: c, key: `${c.codice}-${idx}` }));
        })
      : [];
  // § Correzione 14: il conteggio del titolo segue la composizione
  // prescritta (sindaciEffettivi + 2), non le sole righe già compilate —
  // coerente con "Numero componenti" della sezione, che conta allo stesso
  // modo. Invariato (righe compilate, ora filtrate per tipo di titolare §
  // Correzione 16) per ogni altra card/configurazione.
  const numeroComponenti =
    collegioSindacale?.sindaciEffettivi != null ? collegioSindacale.sindaciEffettivi + 2 : incarichiFiltrati.length;
  const vuoto = incarichiFiltrati.length === 0 && segnaposto.length === 0;
  return (
    <DataTableCard title={titolo} count={numeroComponenti} editing={editingScheda} addTrigger={addTrigger}>
      {vuoto ? (
        <EmptyTableMessage>{etichettaVuoto}</EmptyTableMessage>
      ) : (
        <Table>
          {variante === "soci" ? (
            <>
              <TableHeader>
                <TableRow>
                  <TableHead>Persona</TableHead>
                  <TableHead className="text-center">Ruolo</TableHead>
                  <TableHead className="text-center">Data di nomina</TableHead>
                  <TableHead className="text-center">Quota</TableHead>
                  <TableHead className="text-center">Valore nominale</TableHead>
                  <TableHead className="text-center">Versamento</TableHead>
                  <TableHead className="text-center">Stato di carica</TableHead>
                  <TableHead className="text-center">Verifica</TableHead>
                  {editingScheda && <TableHead className="w-24" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {incarichiFiltrati.map((incarico) => {
                  const statoCarica = valoreCaratteristica(incarico, "A25");
                  const nomeIncarico = `${incarico.ruolo.denominazione} ${nomeTitolare(incarico)}`;
                  return (
                    <TableRow key={incarico.id}>
                      <TableCell>
                        <CellaTitolare incarico={incarico} />
                      </TableCell>
                      <TableCell className="text-center">{incarico.ruolo.denominazione}</TableCell>
                      <TableCell className="text-center">{primaData(incarico, ["A49", "A01"])}</TableCell>
                      <TableCell className="text-center">{formatPercentuale(valoreCaratteristica(incarico, "A54"))}</TableCell>
                      <TableCell className="text-center">{formatCurrency(valoreCaratteristica(incarico, "A53"))}</TableCell>
                      <TableCell className="text-center">{formatCurrency(valoreCaratteristica(incarico, "A56"))}</TableCell>
                      <TableCell className="text-center">{statoCarica ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <IncaricoVerificationPopover
                            incarico={incarico}
                            nomeIncarico={nomeIncarico}
                            consulente={consulente}
                            onDecided={carica}
                            disabled={editingScheda === true}
                          />
                        </div>
                      </TableCell>
                      {editingScheda && (
                        <TableCell className="flex justify-end gap-1">
                          <IncaricoFormDialog
                            ruoli={ruoli}
                            incarico={incarico}
                            onSaved={carica}
                            trigger={
                              <Button variant="ghost" size="icon" aria-label="Modifica">
                                <PencilIcon className="size-4" />
                              </Button>
                            }
                          />
                          <Button variant="ghost" size="icon" aria-label="Elimina" onClick={() => onElimina(incarico)}>
                            <Trash2Icon className="size-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </>
          ) : (
            <>
              <TableHeader>
                <TableRow>
                  <TableHead>Persona</TableHead>
                  <TableHead className="text-center">Ruolo</TableHead>
                  <TableHead className="text-center">Carica</TableHead>
                  <TableHead className="text-center">Data di nomina</TableHead>
                  <TableHead className="text-center">Durata</TableHead>
                  <TableHead className="text-center">Stato della carica</TableHead>
                  <TableHead className="text-center">Verifica</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {incarichiFiltrati.map((incarico) => {
                  const statoCarica = valoreCaratteristica(incarico, "A25");
                  const durata = valoreCaratteristica(incarico, "A29");
                  const nomeIncarico = `${incarico.ruolo.denominazione} ${nomeTitolare(incarico)}`;
                  return (
                    <TableRow key={incarico.id}>
                      <TableCell>
                        <CellaTitolare incarico={incarico} />
                      </TableCell>
                      <TableCell className="text-center">{incarico.ruolo.denominazione}</TableCell>
                      <TableCell className="text-center">{etichettaCarica(incarico)}</TableCell>
                      <TableCell className="text-center">{primaData(incarico, ["A49", "A01"])}</TableCell>
                      <TableCell className="text-center">{durata ?? "—"}</TableCell>
                      <TableCell className="text-center">{statoCarica ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <IncaricoVerificationPopover
                            incarico={incarico}
                            nomeIncarico={nomeIncarico}
                            consulente={consulente}
                            onDecided={carica}
                            disabled={editingScheda === true}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <IncaricoFormDialog
                          ruoli={ruoli}
                          incarico={incarico}
                          onSaved={carica}
                          tipoTitolare={tipoTitolare === "GIURIDICA" ? "GIURIDICA" : undefined}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <Button variant="ghost" size="icon" aria-label="Elimina" onClick={() => onElimina(incarico)}>
                          <Trash2Icon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {segnaposto.map(({ carica: opzioneCarica, key }) => (
                  <TableRow key={key} className="text-muted-foreground">
                    <TableCell className="italic">Posto libero</TableCell>
                    <TableCell className="text-center">{ruoloSindaco?.denominazione ?? "Sindaco"}</TableCell>
                    <TableCell className="text-center">{opzioneCarica.etichetta}</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="flex justify-end gap-1">
                      {ruoloSindaco && (
                        <IncaricoFormDialog
                          ruoli={ruoli}
                          onSaved={carica}
                          caricheDisponibili={caricheOpzioni}
                          caricaPredefinita={opzioneCarica.codice}
                          ruoloIdPredefinito={ruoloSindaco.id}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Aggiungi ${opzioneCarica.etichetta.toLowerCase()}`}>
                              <PlusIcon className="size-4" />
                            </Button>
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </>
          )}
        </Table>
      )}
    </DataTableCard>
  );
}
