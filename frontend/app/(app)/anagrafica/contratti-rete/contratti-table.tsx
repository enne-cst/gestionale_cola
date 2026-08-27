"use client";

import { NetworkIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { ContrattoRete } from "@/lib/types/anagrafica-iso9001";

import { deleteContratto } from "./actions";
import { ContrattoDialog } from "./contratto-dialog";

export function ContrattiTable({ dati }: { dati: ContrattoRete[] }) {
  return (
    <DataTableCard
      title="Contratti di rete"
      count={dati.length}
      addTrigger={<ContrattoDialog trigger={<AddRowButton icon={NetworkIcon} />} />}
    >
      {dati.length === 0 ? (
        <EmptyTableMessage>Nessun contratto di rete registrato.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome contratto</TableHead>
              <TableHead>Numero registrazione</TableHead>
              <TableHead>Data adesione</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.nome_contratto}</TableCell>
                <TableCell>{riga.numero_registrazione}</TableCell>
                <TableCell>{formatDate(riga.data_adesione)}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <ContrattoDialog
                    dati={riga}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteContratto.bind(null, riga.id)}
                    confirmMessage={`Eliminare il contratto "${riga.nome_contratto}"?`}
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
