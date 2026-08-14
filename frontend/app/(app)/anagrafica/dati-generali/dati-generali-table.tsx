"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DatiGenerali } from "@/lib/types/anagrafica-iso9001";

import { deleteDatiGenerali } from "./actions";
import { DatiGeneraliDialog } from "./dati-generali-dialog";

export function DatiGeneraliTable({ dati }: { dati: DatiGenerali[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <DatiGeneraliDialog
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
              <TableHead>Addetti</TableHead>
              <TableHead>Dipendenti</TableHead>
              <TableHead>Soci lavoratori</TableHead>
              <TableHead>Organico medio</TableHead>
              <TableHead>Età media</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((rilevazione) => (
              <TableRow key={rilevazione.id}>
                <TableCell className="font-medium">{rilevazione.anno_riferimento}</TableCell>
                <TableCell>{rilevazione.numero_addetti}</TableCell>
                <TableCell>{rilevazione.numero_dipendenti}</TableCell>
                <TableCell>{rilevazione.numero_soci_lavoratori}</TableCell>
                <TableCell>{rilevazione.organico_medio_annuo}</TableCell>
                <TableCell>{rilevazione.eta_media}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <DatiGeneraliDialog
                    dati={rilevazione}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteDatiGenerali.bind(null, rilevazione.id)}
                    confirmMessage={`Eliminare la rilevazione dell'anno ${rilevazione.anno_riferimento}?`}
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
