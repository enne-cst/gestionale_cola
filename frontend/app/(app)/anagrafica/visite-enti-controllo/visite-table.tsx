"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { VisitaEnteControllo } from "@/lib/types/anagrafica-iso9001";

import { deleteVisita } from "./actions";
import { VisitaDialog } from "./visita-dialog";

export function VisiteTable({ dati }: { dati: VisitaEnteControllo[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <VisitaDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuova visita
            </Button>
          }
        />
      </div>

      {dati.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna visita registrata.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ente</TableHead>
              <TableHead>Tipologia</TableHead>
              <TableHead>Data visita</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.ente}</TableCell>
                <TableCell>{riga.tipologia_visita}</TableCell>
                <TableCell>{formatDate(riga.data_visita)}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <VisitaDialog
                    dati={riga}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteVisita.bind(null, riga.id)}
                    confirmMessage={`Eliminare la visita di "${riga.ente}"?`}
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
