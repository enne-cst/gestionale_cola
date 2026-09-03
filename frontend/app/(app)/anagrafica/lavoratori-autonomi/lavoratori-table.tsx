"use client";

import { PencilIcon, UserCogIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import type { CatalogoVoce, LavoratoreAutonomo } from "@/lib/types/anagrafica-iso9001";

import { deleteLavoratore } from "./actions";
import { LavoratoreDialog } from "./lavoratore-dialog";

const RESOURCE_PATH = "lavoratori-autonomi";

export function LavoratoriTable({
  dati,
  stati,
  onChanged,
}: {
  dati: LavoratoreAutonomo[];
  stati: CatalogoVoce[];
  onChanged?: () => void;
}) {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Lavoratori autonomi"
      count={dati.length}
      addTrigger={<LavoratoreDialog stati={stati} onSaved={onChanged} trigger={<AddRowButton icon={UserCogIcon} />} />}
    >
      {dati.length === 0 ? (
        <EmptyTableMessage>Nessun lavoratore autonomo registrato.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nominativo / Ragione sociale</TableHead>
              <TableHead>Mansione</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="w-16">Verifica</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.nominativo_ragione_sociale}</TableCell>
                <TableCell>{riga.mansione}</TableCell>
                <TableCell>{catalogoLabel(stati, riga.stato_id)}</TableCell>
                <TableCell>
                  <RigaIso9001VerificationPopover
                    resourcePath={RESOURCE_PATH}
                    riga={riga}
                    nomeRiga={riga.nominativo_ragione_sociale}
                    consulente={consulente}
                    onDecided={() => onChanged?.()}
                  />
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <LavoratoreDialog
                    dati={riga}
                    stati={stati}
                    onSaved={onChanged}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteLavoratore.bind(null, riga.id)}
                    confirmMessage={`Eliminare "${riga.nominativo_ragione_sociale}"?`}
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
