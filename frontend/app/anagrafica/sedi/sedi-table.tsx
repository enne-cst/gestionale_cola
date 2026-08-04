"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import type { Sede } from "@/lib/types/anagrafica";

import { deleteSede } from "./actions";
import { SedeDialog } from "./sede-dialog";

export function SediTable({ sedi }: { sedi: Sede[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <SedeDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuova sede
            </Button>
          }
        />
      </div>

      {sedi.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna sede registrata.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Denominazione</TableHead>
              <TableHead>Comune</TableHead>
              <TableHead>Indirizzo</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sedi.map((sede) => (
              <TableRow key={sede.id}>
                <TableCell>{sede.tipo_sede}</TableCell>
                <TableCell>{sede.denominazione_sede ?? "—"}</TableCell>
                <TableCell>{sede.comune ?? "—"}</TableCell>
                <TableCell>
                  {[sede.indirizzo, sede.numero_civico].filter(Boolean).join(" ") || "—"}
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <SedeDialog
                    dati={sede}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton action={deleteSede.bind(null, sede.id)} confirmMessage={`Eliminare la sede "${sede.denominazione_sede ?? sede.tipo_sede}"?`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
