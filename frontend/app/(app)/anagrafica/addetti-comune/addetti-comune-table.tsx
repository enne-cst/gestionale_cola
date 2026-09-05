"use client";

import { PencilIcon, UsersIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { PinRecordButton } from "@/components/pin-record-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { AddettiComune } from "@/lib/types/anagrafica";

import { deleteAddettiComune } from "./actions";
import { AddettiComuneDialog } from "./addetti-comune-dialog";

const SEZIONE_SLUG = "addetti-comune";

export function AddettiComuneTable({
  distribuzioni,
  recordIdsInPanoramica,
}: {
  distribuzioni: AddettiComune[];
  recordIdsInPanoramica: string[];
}) {
  return (
    <DataTableCard
      title="Addetti per comune"
      count={distribuzioni.length}
      addTrigger={<AddettiComuneDialog trigger={<AddRowButton icon={UsersIcon} />} />}
    >
      {(inModifica) =>
        distribuzioni.length === 0 ? (
          <EmptyTableMessage>Nessuna distribuzione registrata.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comune</TableHead>
                <TableHead>Provincia</TableHead>
                <TableHead>Sedi/unità locali</TableHead>
                <TableHead>Periodi</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {distribuzioni.map((distribuzione) => (
                <TableRow key={distribuzione.id}>
                  <TableCell className="font-medium">{distribuzione.comune}</TableCell>
                  <TableCell>{distribuzione.provincia ?? "—"}</TableCell>
                  <TableCell>{distribuzione.numero_sedi_unita_locali ?? "—"}</TableCell>
                  <TableCell>{distribuzione.periodi.length}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinRecordButton
                      modulo={MODULO_ANAGRAFICA}
                      sezioneSlug={SEZIONE_SLUG}
                      recordId={distribuzione.id}
                      etichetta={`Addetti a ${distribuzione.comune}`}
                      pinnedInitially={recordIdsInPanoramica.includes(distribuzione.id)}
                    />
                    {inModifica && (
                      <>
                        <AddettiComuneDialog
                          dati={distribuzione}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          action={deleteAddettiComune.bind(null, distribuzione.id)}
                          confirmMessage={`Eliminare la distribuzione per "${distribuzione.comune}"?`}
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
