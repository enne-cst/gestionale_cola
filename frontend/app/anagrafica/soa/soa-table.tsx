"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { PinRecordButton } from "@/components/pin-record-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { formatDate } from "@/lib/format";
import type { Soa } from "@/lib/types/anagrafica";

import { deleteSoa } from "./actions";
import { SoaDialog } from "./soa-dialog";

const SEZIONE_SLUG = "soa";

export function SoaTable({
  attestazioni,
  recordIdsInPanoramica,
}: {
  attestazioni: Soa[];
  recordIdsInPanoramica: string[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <SoaDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuova attestazione
            </Button>
          }
        />
      </div>

      {attestazioni.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna attestazione SOA registrata.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numero</TableHead>
              <TableHead>Organismo</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead>Scadenza</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {attestazioni.map((soa) => (
              <TableRow key={soa.id}>
                <TableCell className="font-medium">{soa.numero_attestazione ?? "—"}</TableCell>
                <TableCell>{soa.organismo_denominazione ?? "—"}</TableCell>
                <TableCell>{soa.categorie.map((c) => c.categoria).join(", ") || "—"}</TableCell>
                <TableCell>{formatDate(soa.data_scadenza)}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <PinRecordButton
                    modulo={MODULO_ANAGRAFICA}
                    sezioneSlug={SEZIONE_SLUG}
                    recordId={soa.id}
                    etichetta={soa.numero_attestazione ?? "Attestazione SOA"}
                    pinnedInitially={recordIdsInPanoramica.includes(soa.id)}
                  />
                  <SoaDialog
                    dati={soa}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteSoa.bind(null, soa.id)}
                    confirmMessage={`Eliminare l'attestazione SOA "${soa.numero_attestazione ?? ""}"?`}
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
