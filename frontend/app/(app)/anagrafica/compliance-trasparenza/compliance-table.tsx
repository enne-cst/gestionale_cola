"use client";

import { ClipboardCheckIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { ComplianceTrasparenza } from "@/lib/types/anagrafica-iso9001";

import { deleteElemento } from "./actions";
import { ElementoDialog } from "./elemento-dialog";

export function ComplianceTable({ dati }: { dati: ComplianceTrasparenza[] }) {
  return (
    <DataTableCard
      title="Compliance e trasparenza"
      count={dati.length}
      addTrigger={<ElementoDialog trigger={<AddRowButton icon={ClipboardCheckIcon} />} />}
    >
      {dati.length === 0 ? (
        <EmptyTableMessage>Nessun elemento registrato.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Elemento</TableHead>
              <TableHead>Presenza</TableHead>
              <TableHead>Data adozione</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.elemento}</TableCell>
                <TableCell>
                  <Badge variant={riga.presenza ? "default" : "secondary"}>{riga.presenza ? "Presente" : "Assente"}</Badge>
                </TableCell>
                <TableCell>{formatDate(riga.data_adozione)}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <ElementoDialog
                    dati={riga}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteElemento.bind(null, riga.id)}
                    confirmMessage={`Eliminare l'elemento "${riga.elemento}"?`}
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
