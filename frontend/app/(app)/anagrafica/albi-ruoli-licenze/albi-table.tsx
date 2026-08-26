"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

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
    <div className="flex flex-col gap-4">
      <div>
        <AlboDialog
          sedi={sedi}
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuova iscrizione
            </Button>
          }
        />
      </div>

      {albi.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna iscrizione registrata.</p>
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
    </div>
  );
}
