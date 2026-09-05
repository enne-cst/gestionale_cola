"use client";

import { PencilIcon, TruckIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import type { CatalogoVoce, FornitoreMateriali } from "@/lib/types/anagrafica-iso9001";

import { deleteFornitore } from "./actions";
import { FornitoreDialog } from "./fornitore-dialog";

const RESOURCE_PATH = "fornitori-materiali";
const SEZIONE_SLUG = "fornitori-materiali";

export function FornitoriTable({
  dati,
  stati,
  onChanged,
}: {
  dati: FornitoreMateriali[];
  stati: CatalogoVoce[];
  onChanged?: () => void;
}) {
  const { ruolo, isRecordPinned, togglePinRecord } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Fornitori di materiali"
      count={dati.length}
      addTrigger={<FornitoreDialog stati={stati} onSaved={onChanged} trigger={<AddRowButton icon={TruckIcon} />} />}
    >
      {(inModifica) =>
        dati.length === 0 ? (
          <EmptyTableMessage>Nessun fornitore registrato.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ragione sociale</TableHead>
                <TableHead>Categoria merceologica</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Referente</TableHead>
                <TableHead className="w-16">Verifica</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dati.map((riga) => (
                <TableRow key={riga.id}>
                  <TableCell className="font-medium">{riga.ragione_sociale}</TableCell>
                  <TableCell>{riga.categoria_merceologica}</TableCell>
                  <TableCell>{catalogoLabel(stati, riga.stato_id)}</TableCell>
                  <TableCell>{riga.referente}</TableCell>
                  <TableCell>
                    <RigaIso9001VerificationPopover
                      resourcePath={RESOURCE_PATH}
                      riga={riga}
                      nomeRiga={riga.ragione_sociale}
                      consulente={consulente}
                      onDecided={() => onChanged?.()}
                    />
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinToggleButton
                      pinned={isRecordPinned(SEZIONE_SLUG, riga.id)}
                      onToggle={() => togglePinRecord(SEZIONE_SLUG, riga.id, riga.ragione_sociale)}
                    />
                    {inModifica && (
                      <>
                        <FornitoreDialog
                          dati={riga}
                          stati={stati}
                          onSaved={onChanged}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          action={deleteFornitore.bind(null, riga.id)}
                          confirmMessage={`Eliminare il fornitore "${riga.ragione_sociale}"?`}
                          onDeleted={onChanged}
                        />
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      }
    </DataTableCard>
  );
}
