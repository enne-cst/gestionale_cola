"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import { formatDate } from "@/lib/format";
import type { CatalogoVoce, Outsourcing } from "@/lib/types/anagrafica-iso9001";

import { deleteOutsourcing } from "./actions";
import { OutsourcingDialog } from "./outsourcing-dialog";

export function OutsourcingTable({ dati, stati }: { dati: Outsourcing[]; stati: CatalogoVoce[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <OutsourcingDialog
          stati={stati}
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuovo affidamento
            </Button>
          }
        />
      </div>

      {dati.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun affidamento registrato.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Processo / attività</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Data inizio</TableHead>
              <TableHead>Referente interno</TableHead>
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
                <TableCell className="flex justify-end gap-1">
                  <OutsourcingDialog
                    dati={riga}
                    stati={stati}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteOutsourcing.bind(null, riga.id)}
                    confirmMessage="Eliminare questo affidamento in outsourcing?"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
