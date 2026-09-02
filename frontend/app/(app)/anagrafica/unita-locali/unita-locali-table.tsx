"use client";

import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UnitaLocaleVerificationPopover } from "@/components/registro/unita-locale-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { formatDate } from "@/lib/format";
import type { UnitaLocaleDetail, UnitaLocaleSummary } from "@/lib/types/anagrafica";

import { eliminaUnitaLocale, getUnitaLocale, getUnitaLocali } from "./actions";
import { UnitaLocaleDialog } from "./unita-locale-dialog";

/** Tabella "Sedi secondarie e unità locali" (§ Correzione 23 punto 2):
 * colonne Riferimento/Tipologia/Indirizzo/Apertura/Attività/ATECO/Stato.
 * Vive nella card omonima (cciaa-section-panel.tsx, case "sedi-secondarie"):
 * `sectionKey` collega "+ Aggiungi" e il click sulla riga alla stessa
 * modalità modifica del banner "Modifica dati", mai un toggle locale
 * (§ [[correzione01-toggle-tabella-vs-scheda]]) — stesso pattern di
 * `TitoliAbilitativiTable`. Nessun pulsante "Aggiorna" proprio: si ricarica
 * da sola dopo ogni salvataggio o eliminazione riuscita. */
export function UnitaLocaliTable({ sectionKey }: { sectionKey: string }) {
  const { ruolo, state } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const editing = state.sections[sectionKey]?.editing ?? false;

  const [unita, setUnita] = useState<UnitaLocaleSummary[] | null>(null);
  const [dialogoAperto, setDialogoAperto] = useState(false);
  const [datiDialogo, setDatiDialogo] = useState<UnitaLocaleDetail | undefined>(undefined);
  const [caricamentoRiga, setCaricamentoRiga] = useState<string | null>(null);

  const carica = useCallback(() => {
    getUnitaLocali()
      .then(setUnita)
      .catch(() => setUnita([]));
  }, []);

  useEffect(() => {
    carica();
  }, [carica]);

  async function apriRiga(id: string) {
    if (!editing || caricamentoRiga) return;
    setCaricamentoRiga(id);
    try {
      const dettaglio = await getUnitaLocale(id);
      setDatiDialogo(dettaglio);
      setDialogoAperto(true);
    } finally {
      setCaricamentoRiga(null);
    }
  }

  function apriNuova() {
    setDatiDialogo(undefined);
    setDialogoAperto(true);
  }

  async function elimina(id: string) {
    await eliminaUnitaLocale(id);
    carica();
  }

  const righe = unita ?? [];

  return (
    <>
      <DataTableCard
        title="Sedi secondarie e unità locali"
        count={righe.length}
        editing={editing}
        addTrigger={<AddRowButton icon={PlusIcon} label="Aggiungi" onClick={apriNuova} />}
      >
        {unita === null ? (
          <EmptyTableMessage>Caricamento…</EmptyTableMessage>
        ) : righe.length === 0 ? (
          <EmptyTableMessage>Nessuna unità locale registrata.</EmptyTableMessage>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Riferimento</TableHead>
                  <TableHead>Tipologia</TableHead>
                  <TableHead>Indirizzo</TableHead>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Attività</TableHead>
                  <TableHead>ATECO</TableHead>
                  <TableHead>Stato</TableHead>
                  {editing && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {righe.map((u) => (
                  <TableRow
                    key={u.id}
                    onClick={() => apriRiga(u.id)}
                    aria-busy={caricamentoRiga === u.id}
                    className={editing ? "cursor-pointer" : undefined}
                  >
                    <TableCell className="font-medium">{u.riferimento_cciaa ?? "—"}</TableCell>
                    <TableCell>{u.tipologia_label ?? "—"}</TableCell>
                    <TableCell>{u.indirizzo_label ?? "—"}</TableCell>
                    <TableCell>{formatDate(u.data_apertura)}</TableCell>
                    <TableCell>{u.attivita_principale_label ?? "—"}</TableCell>
                    <TableCell>{u.ateco_label ?? "—"}</TableCell>
                    <TableCell>
                      <UnitaLocaleVerificationPopover
                        unita={u}
                        consulente={consulente}
                        onDecided={carica}
                        disabled={editing}
                      />
                    </TableCell>
                    {editing && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DeleteButton
                          action={elimina.bind(null, u.id)}
                          confirmMessage={`Eliminare l'unità locale "${u.riferimento_cciaa ?? u.indirizzo_label ?? ""}"?`}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableCard>

      <UnitaLocaleDialog
        open={dialogoAperto}
        dati={datiDialogo}
        onOpenChange={setDialogoAperto}
        onSaved={carica}
      />
    </>
  );
}
