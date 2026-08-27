"use client";

import { PencilIcon, PlusIcon, Trash2Icon, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Button } from "@/components/ui/button";
import { IncaricoFormDialog } from "@/components/registro/incarico-form-dialog";
import { IncaricoVerificationPopover } from "@/components/registro/incarico-verification-popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { eliminaIncarico, getIncarichi, getRuoli } from "@/lib/actions/personale";
import { formatCurrency, formatDate, formatDecimal } from "@/lib/format";
import type { Incarico, RuoloSummary } from "@/lib/types/personale";

/** "Nascita" del soggetto (§5.2 della specifica: luogo e data compilati
 * automaticamente e in sola lettura dal soggetto, mai duplicati sulla
 * carica), stesso formato del prototipo ("Trebisht Bulqize (Albania),
 * 19/02/1979"). */
function nascita(incarico: Incarico): string {
  const { luogo_nascita, data_nascita } = incarico.persona;
  const parti = [luogo_nascita, data_nascita ? formatDate(data_nascita) : null].filter(Boolean);
  return parti.length > 0 ? parti.join(", ") : "—";
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
  // modifica). Omesso per Amministratori/Sindaci: colonne invariate.
  variante?: "soci";
  // Testo del pulsante di inserimento riga, solo per il ramo con
  // `sectionKey` (§ Correzione 05 punto 10: "Aggiungi riga" per la card
  // Amministratori). Default invariato per gli altri chiamanti (Soci).
  addRowLabel?: string;
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
    if (!confirm(`Rimuovere l'incarico di ${incarico.persona.cognome} ${incarico.persona.nome}?`)) return;
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
  const addTrigger = sectionKey ? (
    <IncaricoFormDialog ruoli={ruoli} onSaved={carica} trigger={<AddRowButton icon={PlusIcon} label={addRowLabel} />} />
  ) : (
    <IncaricoFormDialog ruoli={ruoli} onSaved={carica} trigger={<AddRowButton icon={Icon} />} />
  );
  return (
    <DataTableCard title={titolo} count={incarichi.length} editing={editingScheda} addTrigger={addTrigger}>
      {incarichi.length === 0 ? (
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
                {incarichi.map((incarico) => {
                  const statoCarica = valoreCaratteristica(incarico, "A25");
                  const nomeIncarico = `${incarico.ruolo.denominazione} ${incarico.persona.cognome} ${incarico.persona.nome}`;
                  return (
                    <TableRow key={incarico.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {incarico.persona.cognome} {incarico.persona.nome}
                          </span>
                          <span className="text-xs text-muted-foreground">{incarico.persona.codice_fiscale}</span>
                        </div>
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
                  <TableHead className="text-center">Nascita</TableHead>
                  <TableHead className="text-center">Cittadinanza</TableHead>
                  <TableHead className="text-center">Domicilio</TableHead>
                  <TableHead className="text-center">Ruolo</TableHead>
                  <TableHead className="text-center">Data di nomina</TableHead>
                  <TableHead className="text-center">Stato carica</TableHead>
                  <TableHead className="text-center">Verifica</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {incarichi.map((incarico) => {
                  const statoCarica = incarico.valori.A25;
                  const nomeIncarico = `${incarico.ruolo.denominazione} ${incarico.persona.cognome} ${incarico.persona.nome}`;
                  return (
                    <TableRow key={incarico.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {incarico.persona.cognome} {incarico.persona.nome}
                          </span>
                          <span className="text-xs text-muted-foreground">{incarico.persona.codice_fiscale}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{nascita(incarico)}</TableCell>
                      <TableCell className="text-center">{incarico.persona.nazionalita ?? "—"}</TableCell>
                      <TableCell className="text-center">{incarico.persona.residenza ?? "—"}</TableCell>
                      <TableCell className="text-center">{incarico.ruolo.denominazione}</TableCell>
                      <TableCell className="text-center">{primaData(incarico, ["A49", "A01"])}</TableCell>
                      <TableCell className="text-center">
                        {typeof statoCarica === "string" && statoCarica ? statoCarica : "—"}
                      </TableCell>
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
              </TableBody>
            </>
          )}
        </Table>
      )}
    </DataTableCard>
  );
}
