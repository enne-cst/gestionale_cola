"use client";

import { HandCoinsIcon, PencilIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { IndicatoreEconomico } from "@/lib/types/anagrafica-iso9001";

import { deleteIndicatore } from "./actions";
import { IndicatoreDialog } from "./indicatore-dialog";

const RESOURCE_PATH = "indicatori-economici";
const SEZIONE_SLUG = "indicatori-economici";

export function IndicatoriTable({ dati, onChanged }: { dati: IndicatoreEconomico[]; onChanged?: () => void }) {
  const { ruolo, isRecordPinned, togglePinRecord } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Indicatori economici"
      count={dati.length}
      addTrigger={<IndicatoreDialog onSaved={onChanged} trigger={<AddRowButton icon={HandCoinsIcon} />} />}
    >
      {(inModifica) =>
        dati.length === 0 ? (
          <EmptyTableMessage>Nessuna rilevazione registrata.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anno</TableHead>
                <TableHead>Fatturato</TableHead>
                <TableHead>Obiettivo</TableHead>
                <TableHead>Scostamento</TableHead>
                <TableHead className="w-16">Verifica</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dati.map((riga) => (
                <TableRow key={riga.id}>
                  <TableCell className="font-medium">{riga.anno_riferimento}</TableCell>
                  <TableCell>{riga.fatturato}</TableCell>
                  <TableCell>{riga.obiettivo}</TableCell>
                  <TableCell>{riga.scostamento ?? "—"}</TableCell>
                  <TableCell>
                    <RigaIso9001VerificationPopover
                      resourcePath={RESOURCE_PATH}
                      riga={riga}
                      nomeRiga={`Indicatori ${riga.anno_riferimento}`}
                      consulente={consulente}
                      onDecided={() => onChanged?.()}
                    />
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinToggleButton
                      pinned={isRecordPinned(SEZIONE_SLUG, riga.id)}
                      onToggle={() => togglePinRecord(SEZIONE_SLUG, riga.id, `Indicatori economici ${riga.anno_riferimento}`)}
                    />
                    {inModifica && (
                      <>
                        <IndicatoreDialog
                          dati={riga}
                          onSaved={onChanged}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          action={deleteIndicatore.bind(null, riga.id)}
                          confirmMessage={`Eliminare la rilevazione dell'anno ${riga.anno_riferimento}?`}
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
