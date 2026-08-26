"use client";

import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { IncaricoFormDialog } from "@/components/registro/incarico-form-dialog";
import { IncaricoVerificationPopover } from "@/components/registro/incarico-verification-popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { eliminaIncarico, getIncarichi, getRuoli } from "@/lib/actions/personale";
import { formatDate } from "@/lib/format";
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

/** Tabella incorporata Soci/Amministratori/Sindaci (§4/§5/§6 della specifica
 * CCIAA): sopra il motore generico `per_incarichi` già esistente, filtrata
 * per i soli ruoli pertinenti alla card. Nessuna riga inventata: se il
 * ruolo non ha ancora incarichi registrati, la tabella è semplicemente
 * vuota, non un placeholder statico. */
export function IncaricoTable({ ruoliCodici, etichettaVuoto }: { ruoliCodici: string[]; etichettaVuoto: string }) {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <IncaricoFormDialog
          ruoli={ruoli}
          onSaved={carica}
          trigger={
            <Button type="button">
              <PlusIcon className="size-4" />
              Nuovo
            </Button>
          }
        />
      </div>

      {incarichi.length === 0 ? (
        <p className="text-sm text-muted-foreground">{etichettaVuoto}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona</TableHead>
              <TableHead>Nascita</TableHead>
              <TableHead>Cittadinanza</TableHead>
              <TableHead>Domicilio</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Data di nomina</TableHead>
              <TableHead>Stato carica</TableHead>
              <TableHead>Verifica</TableHead>
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
                  <TableCell>{nascita(incarico)}</TableCell>
                  <TableCell>{incarico.persona.nazionalita ?? "—"}</TableCell>
                  <TableCell>{incarico.persona.residenza ?? "—"}</TableCell>
                  <TableCell>{incarico.ruolo.denominazione}</TableCell>
                  <TableCell>{primaData(incarico, ["A49", "A01"])}</TableCell>
                  <TableCell>{typeof statoCarica === "string" && statoCarica ? statoCarica : "—"}</TableCell>
                  <TableCell>
                    <IncaricoVerificationPopover
                      incarico={incarico}
                      nomeIncarico={nomeIncarico}
                      consulente={consulente}
                      onDecided={carica}
                    />
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
        </Table>
      )}
    </div>
  );
}
