"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import type { CatalogoVoce, FornitoreMateriali } from "@/lib/types/anagrafica-iso9001";

import { deleteFornitore } from "./actions";
import { FornitoreDialog } from "./fornitore-dialog";

export function FornitoriTable({ dati, stati }: { dati: FornitoreMateriali[]; stati: CatalogoVoce[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <FornitoreDialog
          stati={stati}
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuovo fornitore
            </Button>
          }
        />
      </div>

      {dati.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun fornitore registrato.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ragione sociale</TableHead>
              <TableHead>Categoria merceologica</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Referente</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.ragione_sociale}</TableCell>
                <TableCell>{riga.categoria_merceologica}</TableCell>
                <TableCell>{catalogoLabel(stati, riga.stato_id)}</TableCell>
                <TableCell>{riga.referente}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <FornitoreDialog
                    dati={riga}
                    stati={stati}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteFornitore.bind(null, riga.id)}
                    confirmMessage={`Eliminare il fornitore "${riga.ragione_sociale}"?`}
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
