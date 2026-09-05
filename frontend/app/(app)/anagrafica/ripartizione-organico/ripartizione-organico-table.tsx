"use client";

import { GaugeIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RipartizioneOrganico } from "@/lib/types/anagrafica-iso9001";

import { deleteRipartizioneOrganico } from "./actions";
import { RipartizioneOrganicoDialog } from "./ripartizione-organico-dialog";

const RESOURCE_PATH = "ripartizione-organico";
const SEZIONE_SLUG = "ripartizione-organico";

export function RipartizioneOrganicoTable({ dati, onChanged }: { dati: RipartizioneOrganico[]; onChanged?: () => void }) {
  const { ruolo, isRecordPinned, togglePinRecord } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Ripartizione organico"
      count={dati.length}
      addTrigger={<RipartizioneOrganicoDialog onSaved={onChanged} trigger={<AddRowButton icon={GaugeIcon} />} />}
    >
      {(inModifica) =>
        dati.length === 0 ? (
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
                <TableHead className="w-16">Verifica</TableHead>
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
                  <TableCell>
                    <RigaIso9001VerificationPopover
                      resourcePath={RESOURCE_PATH}
                      riga={riga}
                      nomeRiga={`Ripartizione ${riga.anno_riferimento}`}
                      consulente={consulente}
                      onDecided={() => onChanged?.()}
                    />
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinToggleButton
                      pinned={isRecordPinned(SEZIONE_SLUG, riga.id)}
                      onToggle={() => togglePinRecord(SEZIONE_SLUG, riga.id, `Ripartizione organico ${riga.anno_riferimento}`)}
                    />
                    {inModifica && (
                      <>
                        <RipartizioneOrganicoDialog
                          dati={riga}
                          onSaved={onChanged}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          action={deleteRipartizioneOrganico.bind(null, riga.id)}
                          confirmMessage={`Eliminare la ripartizione dell'anno ${riga.anno_riferimento}?`}
                          onDeleted={onChanged}
                        />
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      }
    </DataTableCard>
  );
}
