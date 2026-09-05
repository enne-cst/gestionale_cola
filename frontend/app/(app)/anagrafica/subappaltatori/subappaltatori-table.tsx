"use client";

import { HardHatIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import { formatDate } from "@/lib/format";
import type { CatalogoVoce, Subappaltatore } from "@/lib/types/anagrafica-iso9001";

import { deleteSubappaltatore } from "./actions";
import { SubappaltatoreDialog } from "./subappaltatore-dialog";

const RESOURCE_PATH = "subappaltatori";
const SEZIONE_SLUG = "subappaltatori";

export function SubappaltatoriTable({
  dati,
  stati,
  onChanged,
}: {
  dati: Subappaltatore[];
  stati: CatalogoVoce[];
  onChanged?: () => void;
}) {
  const { ruolo, isRecordPinned, togglePinRecord } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Subappaltatori"
      count={dati.length}
      addTrigger={<SubappaltatoreDialog stati={stati} onSaved={onChanged} trigger={<AddRowButton icon={HardHatIcon} />} />}
    >
      {(inModifica) =>
        dati.length === 0 ? (
          <EmptyTableMessage>Nessun subappaltatore registrato.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ragione sociale</TableHead>
                <TableHead>Categoria lavori</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Data inizio</TableHead>
                <TableHead className="w-16">Verifica</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dati.map((riga) => (
                <TableRow key={riga.id}>
                  <TableCell className="font-medium">{riga.ragione_sociale}</TableCell>
                  <TableCell>{riga.categoria_lavori}</TableCell>
                  <TableCell>{catalogoLabel(stati, riga.stato_id)}</TableCell>
                  <TableCell>{formatDate(riga.data_inizio)}</TableCell>
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
                        <SubappaltatoreDialog
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
                          action={deleteSubappaltatore.bind(null, riga.id)}
                          confirmMessage={`Eliminare il subappaltatore "${riga.ragione_sociale}"?`}
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
