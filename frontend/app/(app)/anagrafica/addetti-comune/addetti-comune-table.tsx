"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

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
    <div className="flex flex-col gap-4">
      <div>
        <AddettiComuneDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuova distribuzione
            </Button>
          }
        />
      </div>

      {distribuzioni.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna distribuzione registrata.</p>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
