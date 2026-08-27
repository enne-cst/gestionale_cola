"use client";

import { PencilIcon, PiggyBankIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import { formatDate } from "@/lib/format";
import type { CatalogoVoce, FondoInterprofessionale } from "@/lib/types/anagrafica-iso9001";

import { deleteFondo } from "./actions";
import { FondoDialog } from "./fondo-dialog";

export function FondiTable({
  fondi,
  statiIscrizione,
}: {
  fondi: FondoInterprofessionale[];
  statiIscrizione: CatalogoVoce[];
}) {
  return (
    <DataTableCard
      title="Fondi interprofessionali"
      count={fondi.length}
      addTrigger={
        <FondoDialog statiIscrizione={statiIscrizione} trigger={<AddRowButton icon={PiggyBankIcon} />} />
      }
    >
      {fondi.length === 0 ? (
        <EmptyTableMessage>Nessuna iscrizione registrata.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fondo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Data adesione</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fondi.map((fondo) => (
              <TableRow key={fondo.id}>
                <TableCell className="font-medium">{fondo.fondo_interprofessionale}</TableCell>
                <TableCell>{catalogoLabel(statiIscrizione, fondo.stato_iscrizione_id)}</TableCell>
                <TableCell>{formatDate(fondo.data_adesione)}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <FondoDialog
                    dati={fondo}
                    statiIscrizione={statiIscrizione}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteFondo.bind(null, fondo.id)}
                    confirmMessage={`Eliminare l'iscrizione a "${fondo.fondo_interprofessionale}"?`}
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
