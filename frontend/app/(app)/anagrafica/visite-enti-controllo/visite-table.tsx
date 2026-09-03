"use client";

import { FileWarningIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { VisitaEnteControllo } from "@/lib/types/anagrafica-iso9001";

import { deleteVisita } from "./actions";
import { VisitaDialog } from "./visita-dialog";

const RESOURCE_PATH = "visite-enti-controllo";

export function VisiteTable({ dati, onChanged }: { dati: VisitaEnteControllo[]; onChanged?: () => void }) {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Visite enti di controllo"
      count={dati.length}
      addTrigger={<VisitaDialog onSaved={onChanged} trigger={<AddRowButton icon={FileWarningIcon} />} />}
    >
      {dati.length === 0 ? (
        <EmptyTableMessage>Nessuna visita registrata.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ente</TableHead>
              <TableHead>Tipologia</TableHead>
              <TableHead>Data visita</TableHead>
              <TableHead className="w-16">Verifica</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.ente}</TableCell>
                <TableCell>{riga.tipologia_visita}</TableCell>
                <TableCell>{formatDate(riga.data_visita)}</TableCell>
                <TableCell>
                  <RigaIso9001VerificationPopover
                    resourcePath={RESOURCE_PATH}
                    riga={riga}
                    nomeRiga={riga.ente}
                    consulente={consulente}
                    onDecided={() => onChanged?.()}
                  />
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <VisitaDialog
                    dati={riga}
                    onSaved={onChanged}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteVisita.bind(null, riga.id)}
                    confirmMessage={`Eliminare la visita di "${riga.ente}"?`}
                    onDeleted={onChanged}
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
