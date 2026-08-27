"use client";

import { GaugeIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RipartizioneOrganico } from "@/lib/types/anagrafica-iso9001";

import { deleteRipartizioneOrganico } from "./actions";
import { RipartizioneOrganicoDialog } from "./ripartizione-organico-dialog";

export function RipartizioneOrganicoTable({ dati }: { dati: RipartizioneOrganico[] }) {
  return (
    <DataTableCard
      title="Ripartizione organico"
      count={dati.length}
      addTrigger={<RipartizioneOrganicoDialog trigger={<AddRowButton icon={GaugeIcon} />} />}
    >
      {dati.length === 0 ? (
        <EmptyTableMessage>
          Nessuna ripartizione registrata. Serve prima una rilevazione in &quot;Dati generali del personale&quot; per
          lo stesso anno.
        </EmptyTableMessage>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anno</TableHead>
              <TableHead>Uomini / Donne</TableHead>
              <TableHead>Italiani / Stranieri</TableHead>
              <TableHead>Laureati / Diplomati</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dati.map((riga) => (
              <TableRow key={riga.id}>
                <TableCell className="font-medium">{riga.anno_riferimento}</TableCell>
                <TableCell>
                  {riga.numero_uomini} ({riga.percentuale_uomini ?? "—"}%) / {riga.numero_donne} (
                  {riga.percentuale_donne ?? "—"}%)
                </TableCell>
                <TableCell>
                  {riga.numero_italiani} ({riga.percentuale_italiani ?? "—"}%) / {riga.numero_stranieri} (
                  {riga.percentuale_stranieri ?? "—"}%)
                </TableCell>
                <TableCell>
                  {riga.numero_laureati} ({riga.percentuale_laureati ?? "—"}%) / {riga.numero_diplomati} (
                  {riga.percentuale_diplomati ?? "—"}%)
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <RipartizioneOrganicoDialog
                    dati={riga}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteRipartizioneOrganico.bind(null, riga.id)}
                    confirmMessage={`Eliminare la ripartizione dell'anno ${riga.anno_riferimento}?`}
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
