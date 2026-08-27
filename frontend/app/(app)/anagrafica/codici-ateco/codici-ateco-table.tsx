"use client";

import { BadgeCheckIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { PinRecordButton } from "@/components/pin-record-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { CodiceAteco, Sede } from "@/lib/types/anagrafica";

import { deleteCodiceAteco } from "./actions";
import { CodiceAtecoDialog } from "./codice-ateco-dialog";

const SEZIONE_SLUG = "codici-ateco";

export function CodiciAtecoTable({
  codici,
  sedi = [],
  recordIdsInPanoramica,
}: {
  codici: CodiceAteco[];
  sedi?: Sede[];
  recordIdsInPanoramica: string[];
}) {
  return (
    <DataTableCard
      title="Codici ATECO"
      count={codici.length}
      addTrigger={<CodiceAtecoDialog sedi={sedi} trigger={<AddRowButton icon={BadgeCheckIcon} />} />}
    >
      {codici.length === 0 ? (
        <EmptyTableMessage>Nessun codice ATECO registrato.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codice</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Classificazione</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {codici.map((codice) => (
              <TableRow key={codice.id}>
                <TableCell className="font-medium">{codice.codice}</TableCell>
                <TableCell>{codice.descrizione ?? "—"}</TableCell>
                <TableCell>{codice.ruolo_codice ?? "—"}</TableCell>
                <TableCell>{codice.classificazione ?? "—"}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <PinRecordButton
                    modulo={MODULO_ANAGRAFICA}
                    sezioneSlug={SEZIONE_SLUG}
                    recordId={codice.id}
                    etichetta={`Codice ATECO ${codice.codice}`}
                    pinnedInitially={recordIdsInPanoramica.includes(codice.id)}
                  />
                  <CodiceAtecoDialog
                    dati={codice}
                    sedi={sedi}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteCodiceAteco.bind(null, codice.id)}
                    confirmMessage={`Eliminare il codice ATECO "${codice.codice}"?`}
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
