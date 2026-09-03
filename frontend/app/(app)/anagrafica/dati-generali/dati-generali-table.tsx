"use client";

import { PencilIcon, UsersIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DatiGenerali } from "@/lib/types/anagrafica-iso9001";

import { deleteDatiGenerali } from "./actions";
import { DatiGeneraliDialog } from "./dati-generali-dialog";

const RESOURCE_PATH = "dati-generali";

export function DatiGeneraliTable({ dati, onChanged }: { dati: DatiGenerali[]; onChanged?: () => void }) {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Dati generali del personale"
      count={dati.length}
      addTrigger={<DatiGeneraliDialog onSaved={onChanged} trigger={<AddRowButton icon={UsersIcon} />} />}
    >
      {dati.length === 0 ? (
        <EmptyTableMessage>Nessuna rilevazione registrata.</EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anno</TableHead>
              <TableHead>Addetti</TableHead>
              <TableHead>Dipendenti</TableHead>
              <TableHead>Soci lavoratori</TableHead>
              <TableHead>Organico medio</TableHead>
              <TableHead>Età media</TableHead>
              <TableHead className="w-16">Verifica</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((rilevazione) => (
              <TableRow key={rilevazione.id}>
                <TableCell className="font-medium">{rilevazione.anno_riferimento}</TableCell>
                <TableCell>{rilevazione.numero_addetti}</TableCell>
                <TableCell>{rilevazione.numero_dipendenti}</TableCell>
                <TableCell>{rilevazione.numero_soci_lavoratori}</TableCell>
                <TableCell>{rilevazione.organico_medio_annuo}</TableCell>
                <TableCell>{rilevazione.eta_media}</TableCell>
                <TableCell>
                  <RigaIso9001VerificationPopover
                    resourcePath={RESOURCE_PATH}
                    riga={rilevazione}
                    nomeRiga={`Rilevazione ${rilevazione.anno_riferimento}`}
                    consulente={consulente}
                    onDecided={() => onChanged?.()}
                  />
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <DatiGeneraliDialog
                    dati={rilevazione}
                    onSaved={onChanged}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteDatiGenerali.bind(null, rilevazione.id)}
                    confirmMessage={`Eliminare la rilevazione dell'anno ${rilevazione.anno_riferimento}?`}
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
