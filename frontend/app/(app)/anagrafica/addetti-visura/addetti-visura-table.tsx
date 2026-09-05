"use client";

import { PencilIcon, UsersIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { PinRecordButton } from "@/components/pin-record-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { formatDate } from "@/lib/format";
import type { AddettiVisura } from "@/lib/types/anagrafica";

import { deleteAddettiVisura } from "./actions";
import { AddettiVisuraDialog } from "./addetti-visura-dialog";

const SEZIONE_SLUG = "addetti-visura";

export function AddettiVisuraTable({
  rilevazioni,
  recordIdsInPanoramica,
}: {
  rilevazioni: AddettiVisura[];
  recordIdsInPanoramica: string[];
}) {
  return (
    <DataTableCard
      title="Addetti da visura"
      count={rilevazioni.length}
      addTrigger={<AddettiVisuraDialog trigger={<AddRowButton icon={UsersIcon} />} />}
    >
      {(inModifica) =>
        rilevazioni.length === 0 ? (
          <EmptyTableMessage>Nessuna rilevazione registrata.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anno</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Data rilevazione</TableHead>
                <TableHead>Periodi</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rilevazioni.map((rilevazione) => (
                <TableRow key={rilevazione.id}>
                  <TableCell className="font-medium">{rilevazione.anno_riferimento ?? "—"}</TableCell>
                  <TableCell>{rilevazione.fonte ?? "—"}</TableCell>
                  <TableCell>{formatDate(rilevazione.data_rilevazione)}</TableCell>
                  <TableCell>{rilevazione.periodi.length}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinRecordButton
                      modulo={MODULO_ANAGRAFICA}
                      sezioneSlug={SEZIONE_SLUG}
                      recordId={rilevazione.id}
                      etichetta={`Addetti da visura ${rilevazione.anno_riferimento ?? ""}`.trim()}
                      pinnedInitially={recordIdsInPanoramica.includes(rilevazione.id)}
                    />
                    {inModifica && (
                      <>
                        <AddettiVisuraDialog
                          dati={rilevazione}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          action={deleteAddettiVisura.bind(null, rilevazione.id)}
                          confirmMessage={`Eliminare la rilevazione dell'anno "${rilevazione.anno_riferimento ?? ""}"?`}
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
