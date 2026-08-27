"use client";

import { PencilIcon, ShieldIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import { formatDate } from "@/lib/format";
import type { Assicurazione, CatalogoVoce } from "@/lib/types/anagrafica-iso9001";

import { deleteAssicurazione } from "./actions";
import { AssicurazioneDialog } from "./assicurazione-dialog";

export function AssicurazioniTable({
  dati,
  stati,
  frequenze,
}: {
  dati: Assicurazione[];
  stati: CatalogoVoce[];
  frequenze: CatalogoVoce[];
}) {
  return (
    <DataTableCard
      title="Polizze assicurative"
      count={dati.length}
      addTrigger={
        <AssicurazioneDialog stati={stati} frequenze={frequenze} trigger={<AddRowButton icon={ShieldIcon} />} />
      }
    >
      {dati.length === 0 ? (
        <EmptyTableMessage>Nessuna polizza registrata.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipologia</TableHead>
              <TableHead>Compagnia</TableHead>
              <TableHead>Numero polizza</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Scadenza</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.tipologia_polizza}</TableCell>
                <TableCell>{riga.compagnia_assicurativa}</TableCell>
                <TableCell>{riga.numero_polizza}</TableCell>
                <TableCell>{catalogoLabel(stati, riga.stato_id)}</TableCell>
                <TableCell>{formatDate(riga.data_scadenza)}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <AssicurazioneDialog
                    dati={riga}
                    stati={stati}
                    frequenze={frequenze}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteAssicurazione.bind(null, riga.id)}
                    confirmMessage={`Eliminare la polizza "${riga.numero_polizza}"?`}
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
