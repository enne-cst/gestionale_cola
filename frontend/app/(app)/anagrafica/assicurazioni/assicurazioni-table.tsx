"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

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
    <div className="flex flex-col gap-4">
      <div>
        <AssicurazioneDialog
          stati={stati}
          frequenze={frequenze}
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuova polizza
            </Button>
          }
        />
      </div>

      {dati.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna polizza registrata.</p>
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
    </div>
  );
}
