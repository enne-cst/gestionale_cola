"use client";

import { PencilIcon, ShieldIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import { formatDate } from "@/lib/format";
import type { Assicurazione, CatalogoVoce } from "@/lib/types/anagrafica-iso9001";

import { deleteAssicurazione } from "./actions";
import { AssicurazioneDialog } from "./assicurazione-dialog";

const RESOURCE_PATH = "assicurazioni";
const SEZIONE_SLUG = "assicurazioni";

export function AssicurazioniTable({
  dati,
  stati,
  frequenze,
  onChanged,
}: {
  dati: Assicurazione[];
  stati: CatalogoVoce[];
  frequenze: CatalogoVoce[];
  onChanged?: () => void;
}) {
  const { ruolo, isRecordPinned, togglePinRecord } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Polizze assicurative"
      count={dati.length}
      addTrigger={
        <AssicurazioneDialog stati={stati} frequenze={frequenze} onSaved={onChanged} trigger={<AddRowButton icon={ShieldIcon} />} />
      }
    >
      {(inModifica) =>
        dati.length === 0 ? (
          <EmptyTableMessage>Nessuna polizza registrata.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipologia</TableHead>
                <TableHead>Compagnia</TableHead>
                <TableHead>Numero polizza</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead className="w-16">Verifica</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dati.map((riga) => (
                <TableRow key={riga.id}>
                  <TableCell className="font-medium">{riga.tipologia_polizza}</TableCell>
                  <TableCell>{riga.compagnia_assicurativa}</TableCell>
                  <TableCell>{riga.numero_polizza}</TableCell>
                  <TableCell>{catalogoLabel(stati, riga.stato_id)}</TableCell>
                  <TableCell>{formatDate(riga.data_scadenza)}</TableCell>
                  <TableCell>
                    <RigaIso9001VerificationPopover
                      resourcePath={RESOURCE_PATH}
                      riga={riga}
                      nomeRiga={riga.numero_polizza}
                      consulente={consulente}
                      onDecided={() => onChanged?.()}
                    />
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinToggleButton
                      pinned={isRecordPinned(SEZIONE_SLUG, riga.id)}
                      onToggle={() => togglePinRecord(SEZIONE_SLUG, riga.id, riga.numero_polizza)}
                    />
                    {inModifica && (
                      <>
                        <AssicurazioneDialog
                          dati={riga}
                          stati={stati}
                          frequenze={frequenze}
                          onSaved={onChanged}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          action={deleteAssicurazione.bind(null, riga.id)}
                          confirmMessage={`Eliminare la polizza "${riga.numero_polizza}"?`}
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
