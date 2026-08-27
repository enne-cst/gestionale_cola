"use client";

import { MapPinIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { PinRecordButton } from "@/components/pin-record-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { Sede } from "@/lib/types/anagrafica";

import { deleteSede } from "./actions";
import { SedeDialog } from "./sede-dialog";

const SEZIONE_SLUG = "sedi";

export function SediTable({ sedi, recordIdsInPanoramica }: { sedi: Sede[]; recordIdsInPanoramica: string[] }) {
  return (
    <DataTableCard
      title="Sedi"
      count={sedi.length}
      addTrigger={<SedeDialog trigger={<AddRowButton icon={MapPinIcon} />} />}
    >
      {sedi.length === 0 ? (
        <EmptyTableMessage>Nessuna sede registrata.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Denominazione</TableHead>
              <TableHead>Comune</TableHead>
              <TableHead>Indirizzo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="w-28" />
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
                <TableCell>{sede.stato ?? "—"}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <PinRecordButton
                    modulo={MODULO_ANAGRAFICA}
                    sezioneSlug={SEZIONE_SLUG}
                    recordId={sede.id}
                    etichetta={sede.denominazione_sede ?? sede.tipo_sede}
                    pinnedInitially={recordIdsInPanoramica.includes(sede.id)}
                  />
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
    </DataTableCard>
  );
}
