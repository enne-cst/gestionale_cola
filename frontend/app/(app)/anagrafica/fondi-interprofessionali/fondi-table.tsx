"use client";

import { PencilIcon, PiggyBankIcon } from "lucide-react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { RigaIso9001VerificationPopover } from "@/components/registro/riga-iso9001-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogoLabel } from "@/lib/catalogo-helpers";
import { formatDate } from "@/lib/format";
import type { CatalogoVoce, FondoInterprofessionale } from "@/lib/types/anagrafica-iso9001";

import { deleteFondo } from "./actions";
import { FondoDialog } from "./fondo-dialog";

const RESOURCE_PATH = "fondi-interprofessionali";
const SEZIONE_SLUG = "fondi-interprofessionali";

export function FondiTable({
  fondi,
  statiIscrizione,
  onChanged,
}: {
  fondi: FondoInterprofessionale[];
  statiIscrizione: CatalogoVoce[];
  // § pannello del drawer caricato lato client (§ "falle tutte"): rieseguito
  // dopo ogni creazione/modifica/eliminazione/verifica per rileggere
  // l'elenco aggiornato. Facoltativo: senza, la tabella resta di sola
  // lettura per queste azioni (usata anche dalla vecchia pagina dedicata,
  // dove la revalidazione di Next.js già rinfresca i dati da sé).
  onChanged?: () => void;
}) {
  const { ruolo, isRecordPinned, togglePinRecord } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";

  return (
    <DataTableCard
      title="Fondi interprofessionali"
      count={fondi.length}
      addTrigger={
        <FondoDialog statiIscrizione={statiIscrizione} onSaved={onChanged} trigger={<AddRowButton icon={PiggyBankIcon} />} />
      }
    >
      {(inModifica) =>
        fondi.length === 0 ? (
          <EmptyTableMessage>Nessuna iscrizione registrata.</EmptyTableMessage>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fondo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Data adesione</TableHead>
                <TableHead className="w-16">Verifica</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fondi.map((fondo) => (
                <TableRow key={fondo.id}>
                  <TableCell className="font-medium">{fondo.fondo_interprofessionale}</TableCell>
                  <TableCell>{catalogoLabel(statiIscrizione, fondo.stato_iscrizione_id)}</TableCell>
                  <TableCell>{formatDate(fondo.data_adesione)}</TableCell>
                  <TableCell>
                    <RigaIso9001VerificationPopover
                      resourcePath={RESOURCE_PATH}
                      riga={fondo}
                      nomeRiga={fondo.fondo_interprofessionale}
                      consulente={consulente}
                      onDecided={() => onChanged?.()}
                    />
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <PinToggleButton
                      pinned={isRecordPinned(SEZIONE_SLUG, fondo.id)}
                      onToggle={() => togglePinRecord(SEZIONE_SLUG, fondo.id, fondo.fondo_interprofessionale)}
                    />
                    {inModifica && (
                      <>
                        <FondoDialog
                          dati={fondo}
                          statiIscrizione={statiIscrizione}
                          onSaved={onChanged}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          action={deleteFondo.bind(null, fondo.id)}
                          confirmMessage={`Eliminare l'iscrizione a "${fondo.fondo_interprofessionale}"?`}
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
