"use client";

import { useCallback, useEffect, useState } from "react";

import { DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AggiornamentoImpresaVerificationPopover } from "@/components/registro/aggiornamento-impresa-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { etichettaTipologiaEvento } from "@/lib/aggiornamento-impresa-format";
import { formatDate } from "@/lib/format";
import type { CronologiaEvento } from "@/lib/types/anagrafica";

import { getCronologiaAggiornamentoImpresa, getEventoAggiornamentoImpresa } from "./actions";
import { EventoDettaglioDialog } from "./evento-dettaglio-dialog";

const RIGHE_INIZIALI = 8;

/** Tabella "Cronologia aggiornamenti e protocolli" (§6): costruita
 * automaticamente dalla vista aggregata, mai un inserimento manuale (§10 —
 * nessun pulsante "Aggiungi riga", nemmeno in modalità modifica: qui
 * `DataTableCard` è usata senza `addTrigger`, l'unico modo per omettere il
 * pulsante). Il click sulla riga apre sempre il dettaglio di sola lettura
 * (§9) — a differenza delle tabelle con un form di modifica, non è gate su
 * una modalità "modifica dati" perché qui non esiste nulla da modificare. */
export function CronologiaAggiornamentoTable() {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  const [eventi, setEventi] = useState<CronologiaEvento[] | null>(null);
  const [espansa, setEspansa] = useState(false);
  const [dialogoAperto, setDialogoAperto] = useState(false);
  const [datiDialogo, setDatiDialogo] = useState<Awaited<ReturnType<typeof getEventoAggiornamentoImpresa>> | undefined>(
    undefined,
  );
  const [caricamentoRiga, setCaricamentoRiga] = useState<string | null>(null);

  const carica = useCallback(() => {
    getCronologiaAggiornamentoImpresa()
      .then(setEventi)
      .catch(() => setEventi([]));
  }, []);

  useEffect(() => {
    carica();
  }, [carica]);

  async function apriRiga(id: string) {
    if (caricamentoRiga) return;
    setCaricamentoRiga(id);
    try {
      const dettaglio = await getEventoAggiornamentoImpresa(id);
      setDatiDialogo(dettaglio);
      setDialogoAperto(true);
    } finally {
      setCaricamentoRiga(null);
    }
  }

  const tutte = eventi ?? [];
  const righe = espansa ? tutte : tutte.slice(0, RIGHE_INIZIALI);

  return (
    <>
      <DataTableCard title="Cronologia aggiornamenti e protocolli" count={tutte.length}>
        {eventi === null ? (
          <EmptyTableMessage>Caricamento…</EmptyTableMessage>
        ) : tutte.length === 0 ? (
          <EmptyTableMessage>Nessun evento registrato.</EmptyTableMessage>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead>Esito</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {righe.map((evento) => (
                  <TableRow
                    key={evento.evento_id}
                    onClick={() => apriRiga(evento.evento_id)}
                    aria-busy={caricamentoRiga === evento.evento_id}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">{etichettaTipologiaEvento(evento.tipologia)}</TableCell>
                    <TableCell>{formatDate(evento.data)}</TableCell>
                    <TableCell>{evento.origine ?? "—"}</TableCell>
                    <TableCell>{evento.esito ?? "—"}</TableCell>
                    <TableCell>
                      <AggiornamentoImpresaVerificationPopover evento={evento} consulente={consulente} onDecided={carica} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {tutte.length > RIGHE_INIZIALI && (
              <div className="border-t border-[var(--az-border)] px-4 py-2.5 text-center">
                <button
                  type="button"
                  onClick={() => setEspansa((v) => !v)}
                  className="text-xs font-semibold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]"
                >
                  {espansa ? "Mostra solo gli eventi più recenti" : `Vedi tutta la cronologia (${tutte.length})`}
                </button>
              </div>
            )}
          </div>
        )}
      </DataTableCard>

      <EventoDettaglioDialog open={dialogoAperto} dati={datiDialogo} onOpenChange={setDialogoAperto} />
    </>
  );
}
