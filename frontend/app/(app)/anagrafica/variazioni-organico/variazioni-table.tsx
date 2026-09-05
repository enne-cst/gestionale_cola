"use client";

import { PencilIcon, TrendingUpIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { VariazioneOrganico } from "@/lib/types/anagrafica-iso9001";

import { deleteVariazione } from "./actions";
import { VariazioneDialog } from "./variazione-dialog";

const RESOURCE_PATH = "variazioni-organico";
const SEZIONE_SLUG = "variazioni-organico";

export function VariazioniTable({ dati, onChanged }: { dati: VariazioneOrganico[]; onChanged?: () => void }) {
  const { ruolo, isRecordPinned, togglePinRecord } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Variazioni organico"
      count={dati.length}
      addTrigger={<VariazioneDialog onSaved={onChanged} trigger={<AddRowButton icon={TrendingUpIcon} />} />}
    >
      {(inModifica) =>
        dati.length === 0 ? (
          <EmptyTableMessage>Nessuna rilevazione registrata.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anno</TableHead>
                <TableHead>Assunzioni</TableHead>
                <TableHead>Cessazioni</TableHead>
                <TableHead>Variazione %</TableHead>
                <TableHead>Obiettivo %</TableHead>
                <TableHead>Scostamento</TableHead>
                <TableHead className="w-16">Verifica</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dati.map((riga) => (
                <TableRow key={riga.id}>
                  <TableCell className="font-medium">{riga.anno_riferimento}</TableCell>
                  <TableCell>{riga.numero_nuove_assunzioni}</TableCell>
                  <TableCell>{riga.numero_cessazioni}</TableCell>
                  <TableCell>{riga.incremento_decremento_personale_percentuale ?? "—"}</TableCell>
                  <TableCell>{riga.obiettivo_variazione_percentuale}</TableCell>
                  <TableCell>{riga.scostamento ?? "—"}</TableCell>
                  <TableCell>
                    <RigaIso9001VerificationPopover
                      resourcePath={RESOURCE_PATH}
                      riga={riga}
                      nomeRiga={`Variazioni ${riga.anno_riferimento}`}
                      consulente={consulente}
                      onDecided={() => onChanged?.()}
                    />
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinToggleButton
                      pinned={isRecordPinned(SEZIONE_SLUG, riga.id)}
                      onToggle={() => togglePinRecord(SEZIONE_SLUG, riga.id, `Variazioni organico ${riga.anno_riferimento}`)}
                    />
                    {inModifica && (
                      <>
                        <VariazioneDialog
                          dati={riga}
                          onSaved={onChanged}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          action={deleteVariazione.bind(null, riga.id)}
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
