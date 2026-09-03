"use client";

import { HandshakeIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import { formatDate } from "@/lib/format";
import type { CatalogoVoce, Outsourcing } from "@/lib/types/anagrafica-iso9001";

import { deleteOutsourcing } from "./actions";
import { OutsourcingDialog } from "./outsourcing-dialog";

const RESOURCE_PATH = "outsourcing";

export function OutsourcingTable({
  dati,
  stati,
  onChanged,
}: {
  dati: Outsourcing[];
  stati: CatalogoVoce[];
  onChanged?: () => void;
}) {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Outsourcing"
      count={dati.length}
      addTrigger={<OutsourcingDialog stati={stati} onSaved={onChanged} trigger={<AddRowButton icon={HandshakeIcon} />} />}
    >
      {dati.length === 0 ? (
        <EmptyTableMessage>Nessun affidamento registrato.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Processo / attività</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Data inizio</TableHead>
              <TableHead>Referente interno</TableHead>
              <TableHead className="w-16">Verifica</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="max-w-xs truncate font-medium">{riga.processo_attivita_affidata}</TableCell>
                <TableCell>{catalogoLabel(stati, riga.stato_id)}</TableCell>
                <TableCell>{formatDate(riga.data_inizio)}</TableCell>
                <TableCell>{riga.referente_interno}</TableCell>
                <TableCell>
                  <RigaIso9001VerificationPopover
                    resourcePath={RESOURCE_PATH}
                    riga={riga}
                    nomeRiga={riga.processo_attivita_affidata}
                    consulente={consulente}
                    onDecided={() => onChanged?.()}
                  />
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <OutsourcingDialog
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
                    action={deleteOutsourcing.bind(null, riga.id)}
                    confirmMessage="Eliminare questo affidamento in outsourcing?"
                    onDeleted={onChanged}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTableCard>
  );
}
