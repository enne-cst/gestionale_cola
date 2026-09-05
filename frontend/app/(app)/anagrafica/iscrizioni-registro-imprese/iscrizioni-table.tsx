"use client";

import { PencilIcon, ScrollTextIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { PinRecordButton } from "@/components/pin-record-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { formatDate } from "@/lib/format";
import type { IscrizioneRegistroImprese } from "@/lib/types/anagrafica";

import { deleteIscrizione } from "./actions";
import { IscrizioneDialog } from "./iscrizione-dialog";

const SEZIONE_SLUG = "iscrizioni-registro-imprese";

export function IscrizioniTable({
  iscrizioni,
  recordIdsInPanoramica,
}: {
  iscrizioni: IscrizioneRegistroImprese[];
  recordIdsInPanoramica: string[];
}) {
  return (
    <DataTableCard
      title="Iscrizioni registro imprese"
      count={iscrizioni.length}
      addTrigger={<IscrizioneDialog trigger={<AddRowButton icon={ScrollTextIcon} />} />}
    >
      {(inModifica) =>
        iscrizioni.length === 0 ? (
          <EmptyTableMessage>Nessuna iscrizione registrata.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Sezione</TableHead>
                <TableHead>Data iscrizione</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {iscrizioni.map((iscrizione) => (
                <TableRow key={iscrizione.id}>
                  <TableCell>{iscrizione.tipo_iscrizione ?? "—"}</TableCell>
                  <TableCell>{iscrizione.sezione ?? "—"}</TableCell>
                  <TableCell>{formatDate(iscrizione.data_iscrizione)}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinRecordButton
                      modulo={MODULO_ANAGRAFICA}
                      sezioneSlug={SEZIONE_SLUG}
                      recordId={iscrizione.id}
                      etichetta={iscrizione.tipo_iscrizione ?? "Iscrizione registro imprese"}
                      pinnedInitially={recordIdsInPanoramica.includes(iscrizione.id)}
                    />
                    {inModifica && (
                      <>
                        <IscrizioneDialog
                          dati={iscrizione}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          action={deleteIscrizione.bind(null, iscrizione.id)}
                          confirmMessage={`Eliminare l'iscrizione "${iscrizione.tipo_iscrizione ?? ""}"?`}
                        />
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      }
    </DataTableCard>
  );
}
