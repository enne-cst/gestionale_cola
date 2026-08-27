"use client";

import { AwardIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { PinRecordButton } from "@/components/pin-record-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { formatDate } from "@/lib/format";
import type { AlboRuoloLicenza, Sede } from "@/lib/types/anagrafica";

import { deleteAlbo } from "./actions";
import { AlboDialog } from "./albo-dialog";

const SEZIONE_SLUG = "albi-ruoli-licenze";

export function AlbiTable({
  albi,
  sedi = [],
  recordIdsInPanoramica,
}: {
  albi: AlboRuoloLicenza[];
  sedi?: Sede[];
  recordIdsInPanoramica: string[];
}) {
  return (
    <DataTableCard
      title="Albi, ruoli e licenze"
      count={albi.length}
      addTrigger={<AlboDialog sedi={sedi} trigger={<AddRowButton icon={AwardIcon} />} />}
    >
      {albi.length === 0 ? (
        <EmptyTableMessage>Nessuna iscrizione registrata.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipologia</TableHead>
              <TableHead>Numero</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Scadenza</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {albi.map((albo) => (
              <TableRow key={albo.id}>
                <TableCell className="font-medium">{albo.tipologia}</TableCell>
                <TableCell>{albo.numero_iscrizione ?? "—"}</TableCell>
                <TableCell>{albo.stato ?? "—"}</TableCell>
                <TableCell>{formatDate(albo.data_scadenza)}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <PinRecordButton
                    modulo={MODULO_ANAGRAFICA}
                    sezioneSlug={SEZIONE_SLUG}
                    recordId={albo.id}
                    etichetta={albo.tipologia}
                    pinnedInitially={recordIdsInPanoramica.includes(albo.id)}
                  />
                  <AlboDialog
                    dati={albo}
                    sedi={sedi}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteAlbo.bind(null, albo.id)}
                    confirmMessage={`Eliminare l'iscrizione "${albo.tipologia}"?`}
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
