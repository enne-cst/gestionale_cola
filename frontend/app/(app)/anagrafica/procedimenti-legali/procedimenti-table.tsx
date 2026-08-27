"use client";

import { PencilIcon, ScaleIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import { formatDate } from "@/lib/format";
import type { CatalogoVoce, ProcedimentoLegale } from "@/lib/types/anagrafica-iso9001";

import { deleteProcedimento } from "./actions";
import { ProcedimentoDialog } from "./procedimento-dialog";

export function ProcedimentiTable({ dati, stati }: { dati: ProcedimentoLegale[]; stati: CatalogoVoce[] }) {
  return (
    <DataTableCard
      title="Procedimenti legali"
      count={dati.length}
      addTrigger={<ProcedimentoDialog stati={stati} trigger={<AddRowButton icon={ScaleIcon} />} />}
    >
      {dati.length === 0 ? (
        <EmptyTableMessage>Nessun procedimento registrato.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipologia</TableHead>
              <TableHead>Controparte</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Data inizio</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.tipologia_procedimento}</TableCell>
                <TableCell>{riga.controparte}</TableCell>
                <TableCell>{catalogoLabel(stati, riga.stato_id)}</TableCell>
                <TableCell>{formatDate(riga.data_inizio)}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <ProcedimentoDialog
                    dati={riga}
                    stati={stati}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteProcedimento.bind(null, riga.id)}
                    confirmMessage={`Eliminare il procedimento "${riga.tipologia_procedimento}"?`}
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
