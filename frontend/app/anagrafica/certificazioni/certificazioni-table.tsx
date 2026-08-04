"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { PinRecordButton } from "@/components/pin-record-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { Certificazione } from "@/lib/types/anagrafica";

import { deleteCertificazione } from "./actions";
import { CertificazioneDialog } from "./certificazione-dialog";

const SEZIONE_SLUG = "certificazioni";

export function CertificazioniTable({
  certificazioni,
  recordIdsInPanoramica,
}: {
  certificazioni: Certificazione[];
  recordIdsInPanoramica: string[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <CertificazioneDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              Nuova certificazione
            </Button>
          }
        />
      </div>

      {certificazioni.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna certificazione registrata.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipologia</TableHead>
              <TableHead>Norma</TableHead>
              <TableHead>Organismo</TableHead>
              <TableHead>Settori IAF</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificazioni.map((cert) => (
              <TableRow key={cert.id}>
                <TableCell className="font-medium">{cert.tipologia_certificazione ?? cert.sigla ?? "—"}</TableCell>
                <TableCell>{cert.norma_riferimento ?? "—"}</TableCell>
                <TableCell>{cert.organismo_certificatore ?? "—"}</TableCell>
                <TableCell>{cert.settori_iaf.map((s) => s.codice_iaf).filter(Boolean).join(", ") || "—"}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <PinRecordButton
                    modulo={MODULO_ANAGRAFICA}
                    sezioneSlug={SEZIONE_SLUG}
                    recordId={cert.id}
                    etichetta={cert.tipologia_certificazione ?? cert.sigla ?? "Certificazione"}
                    pinnedInitially={recordIdsInPanoramica.includes(cert.id)}
                  />
                  <CertificazioneDialog
                    dati={cert}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <PencilIcon className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    action={deleteCertificazione.bind(null, cert.id)}
                    confirmMessage={`Eliminare la certificazione "${cert.tipologia_certificazione ?? cert.sigla ?? ""}"?`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
