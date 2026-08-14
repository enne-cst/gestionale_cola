"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { VariazioneOrganico } from "@/lib/types/anagrafica-iso9001";

import { deleteVariazione } from "./actions";
import { VariazioneDialog } from "./variazione-dialog";

export function VariazioniTable({ dati }: { dati: VariazioneOrganico[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <VariazioneDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuova rilevazione
            </Button>
          }
        />
      </div>

      {dati.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna rilevazione registrata.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anno</TableHead>
              <TableHead>Assunzioni</TableHead>
              <TableHead>Cessazioni</TableHead>
              <TableHead>Variazione %</TableHead>
              <TableHead>Obiettivo %</TableHead>
              <TableHead>Scostamento</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.anno_riferimento}</TableCell>
                <TableCell>{riga.numero_nuove_assunzioni}</TableCell>
                <TableCell>{riga.numero_cessazioni}</TableCell>
                <TableCell>{riga.incremento_decremento_personale_percentuale ?? "—"}</TableCell>
                <TableCell>{riga.obiettivo_variazione_percentuale}</TableCell>
                <TableCell>{riga.scostamento ?? "—"}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <VariazioneDialog
                    dati={riga}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteVariazione.bind(null, riga.id)}
                    confirmMessage={`Eliminare la rilevazione dell'anno ${riga.anno_riferimento}?`}
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
