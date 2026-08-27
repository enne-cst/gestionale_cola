"use client";

import { PencilIcon, PhoneIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { PinRecordButton } from "@/components/pin-record-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { Contatto } from "@/lib/types/anagrafica";

import { deleteContatto } from "./actions";
import { ContattoDialog } from "./contatto-dialog";

const SEZIONE_SLUG = "contatti";

export function ContattiTable({
  contatti,
  recordIdsInPanoramica,
}: {
  contatti: Contatto[];
  recordIdsInPanoramica: string[];
}) {
  return (
    <DataTableCard
      title="Contatti e recapiti"
      count={contatti.length}
      addTrigger={<ContattoDialog trigger={<AddRowButton icon={PhoneIcon} />} />}
    >
      {contatti.length === 0 ? (
        <EmptyTableMessage>Nessun contatto registrato.</EmptyTableMessage>
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
                  <PinRecordButton
                    modulo={MODULO_ANAGRAFICA}
                    sezioneSlug={SEZIONE_SLUG}
                    recordId={contatto.id}
                    etichetta={`${contatto.tipo_contatto} — ${contatto.valore}`}
                    pinnedInitially={recordIdsInPanoramica.includes(contatto.id)}
                  />
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
    </DataTableCard>
  );
}
