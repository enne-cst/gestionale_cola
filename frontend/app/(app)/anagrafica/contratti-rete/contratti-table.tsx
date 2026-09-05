"use client";

import { NetworkIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { ContrattoRete } from "@/lib/types/anagrafica-iso9001";

import { deleteContratto } from "./actions";
import { ContrattoDialog } from "./contratto-dialog";

const RESOURCE_PATH = "contratti-rete";
const SEZIONE_SLUG = "contratti-rete";

export function ContrattiTable({ dati, onChanged }: { dati: ContrattoRete[]; onChanged?: () => void }) {
  const { ruolo, isRecordPinned, togglePinRecord } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Contratti di rete"
      count={dati.length}
      addTrigger={<ContrattoDialog onSaved={onChanged} trigger={<AddRowButton icon={NetworkIcon} />} />}
    >
      {(inModifica) =>
        dati.length === 0 ? (
          <EmptyTableMessage>Nessun contratto di rete registrato.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome contratto</TableHead>
                <TableHead>Numero registrazione</TableHead>
                <TableHead>Data adesione</TableHead>
                <TableHead className="w-16">Verifica</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dati.map((riga) => (
                <TableRow key={riga.id}>
                  <TableCell className="font-medium">{riga.nome_contratto}</TableCell>
                  <TableCell>{riga.numero_registrazione}</TableCell>
                  <TableCell>{formatDate(riga.data_adesione)}</TableCell>
                  <TableCell>
                    <RigaIso9001VerificationPopover
                      resourcePath={RESOURCE_PATH}
                      riga={riga}
                      nomeRiga={riga.nome_contratto}
                      consulente={consulente}
                      onDecided={() => onChanged?.()}
                    />
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinToggleButton
                      pinned={isRecordPinned(SEZIONE_SLUG, riga.id)}
                      onToggle={() => togglePinRecord(SEZIONE_SLUG, riga.id, riga.nome_contratto)}
                    />
                    {inModifica && (
                      <>
                        <ContrattoDialog
                          dati={riga}
                          onSaved={onChanged}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          action={deleteContratto.bind(null, riga.id)}
                          confirmMessage={`Eliminare il contratto "${riga.nome_contratto}"?`}
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
