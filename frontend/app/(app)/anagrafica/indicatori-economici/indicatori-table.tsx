"use client";

import { HandCoinsIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { IndicatoreEconomico } from "@/lib/types/anagrafica-iso9001";

import { deleteIndicatore } from "./actions";
import { IndicatoreDialog } from "./indicatore-dialog";

export function IndicatoriTable({ dati }: { dati: IndicatoreEconomico[] }) {
  return (
    <DataTableCard
      title="Indicatori economici"
      count={dati.length}
      addTrigger={<IndicatoreDialog trigger={<AddRowButton icon={HandCoinsIcon} />} />}
    >
      {dati.length === 0 ? (
        <EmptyTableMessage>Nessuna rilevazione registrata.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anno</TableHead>
              <TableHead>Fatturato</TableHead>
              <TableHead>Obiettivo</TableHead>
              <TableHead>Scostamento</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.anno_riferimento}</TableCell>
                <TableCell>{riga.fatturato}</TableCell>
                <TableCell>{riga.obiettivo}</TableCell>
                <TableCell>{riga.scostamento ?? "—"}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <IndicatoreDialog
                    dati={riga}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteIndicatore.bind(null, riga.id)}
                    confirmMessage={`Eliminare la rilevazione dell'anno ${riga.anno_riferimento}?`}
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
