"use client";

import { PencilIcon, ScaleIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import { formatDate } from "@/lib/format";
import type { CatalogoVoce, ProcedimentoLegale } from "@/lib/types/anagrafica-iso9001";

import { deleteProcedimento } from "./actions";
import { ProcedimentoDialog } from "./procedimento-dialog";

const RESOURCE_PATH = "procedimenti-legali";
const SEZIONE_SLUG = "procedimenti-legali";

export function ProcedimentiTable({
  dati,
  stati,
  onChanged,
}: {
  dati: ProcedimentoLegale[];
  stati: CatalogoVoce[];
  onChanged?: () => void;
}) {
  const { ruolo, isRecordPinned, togglePinRecord } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Procedimenti legali"
      count={dati.length}
      addTrigger={<ProcedimentoDialog stati={stati} onSaved={onChanged} trigger={<AddRowButton icon={ScaleIcon} />} />}
    >
      {(inModifica) =>
        dati.length === 0 ? (
          <EmptyTableMessage>Nessun procedimento registrato.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipologia</TableHead>
                <TableHead>Controparte</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Data inizio</TableHead>
                <TableHead className="w-16">Verifica</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dati.map((riga) => (
                <TableRow key={riga.id}>
                  <TableCell className="font-medium">{riga.tipologia_procedimento}</TableCell>
                  <TableCell>{riga.controparte}</TableCell>
                  <TableCell>{catalogoLabel(stati, riga.stato_id)}</TableCell>
                  <TableCell>{formatDate(riga.data_inizio)}</TableCell>
                  <TableCell>
                    <RigaIso9001VerificationPopover
                      resourcePath={RESOURCE_PATH}
                      riga={riga}
                      nomeRiga={riga.tipologia_procedimento}
                      consulente={consulente}
                      onDecided={() => onChanged?.()}
                    />
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinToggleButton
                      pinned={isRecordPinned(SEZIONE_SLUG, riga.id)}
                      onToggle={() => togglePinRecord(SEZIONE_SLUG, riga.id, riga.tipologia_procedimento)}
                    />
                    {inModifica && (
                      <>
                        <ProcedimentoDialog
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
                          action={deleteProcedimento.bind(null, riga.id)}
                          confirmMessage={`Eliminare il procedimento "${riga.tipologia_procedimento}"?`}
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
