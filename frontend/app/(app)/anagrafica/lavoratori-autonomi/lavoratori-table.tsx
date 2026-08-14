"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import type { CatalogoVoce, LavoratoreAutonomo } from "@/lib/types/anagrafica-iso9001";

import { deleteLavoratore } from "./actions";
import { LavoratoreDialog } from "./lavoratore-dialog";

export function LavoratoriTable({ dati, stati }: { dati: LavoratoreAutonomo[]; stati: CatalogoVoce[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <LavoratoreDialog
          stati={stati}
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuovo lavoratore autonomo
            </Button>
          }
        />
      </div>

      {dati.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun lavoratore autonomo registrato.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nominativo / Ragione sociale</TableHead>
              <TableHead>Mansione</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.nominativo_ragione_sociale}</TableCell>
                <TableCell>{riga.mansione}</TableCell>
                <TableCell>{catalogoLabel(stati, riga.stato_id)}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <LavoratoreDialog
                    dati={riga}
                    stati={stati}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteLavoratore.bind(null, riga.id)}
                    confirmMessage={`Eliminare "${riga.nominativo_ragione_sociale}"?`}
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
