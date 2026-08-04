"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Contatto } from "@/lib/types/anagrafica";

import { deleteContatto } from "./actions";
import { ContattoDialog } from "./contatto-dialog";

export function ContattiTable({ contatti }: { contatti: Contatto[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <ContattoDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuovo contatto
            </Button>
          }
        />
      </div>

      {contatti.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun contatto registrato.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Valore</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead />
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contatti.map((contatto) => (
              <TableRow key={contatto.id}>
                <TableCell>{contatto.tipo_contatto}</TableCell>
                <TableCell>{contatto.valore}</TableCell>
                <TableCell>{contatto.descrizione ?? "—"}</TableCell>
                <TableCell>{contatto.principale && <Badge variant="secondary">Principale</Badge>}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <ContattoDialog
                    dati={contatto}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteContatto.bind(null, contatto.id)}
                    confirmMessage={`Eliminare il contatto "${contatto.valore}"?`}
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
