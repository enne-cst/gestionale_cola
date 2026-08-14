"use client";

import { PencilIcon } from "lucide-react";

import { IconAvatar } from "@/components/icon-avatar";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataRow } from "@/components/data-row";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { IdentificazioneCamerale } from "@/lib/types/anagrafica";

const SECTION_KEY = "informazioni-societarie";

/** Card di anteprima "Identificazione camerale" (§8.2): apre il pannello
 * temporaneo del workspace invece di navigare a una pagina intera. Il
 * pannello che si apre è intitolato "Informazioni societarie" (§16.1: i
 * suoi campi coincidono con `ana_identificazione_camerale`). */
export function InformazioniSocietarieCard({ identificazione }: { identificazione: IdentificazioneCamerale | null }) {
  const { openDrawer } = useWorkspace();
  const compilata = Boolean(identificazione?.ragione_sociale);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base">
          <IconAvatar icon={SEZIONE_ICONE["identificazione-camerale"]} size="sm" />
          Identificazione camerale
        </CardTitle>
        <CardAction className="flex items-center gap-1">
          <SectionStatusBadge compilata={compilata} completeLabel="Completo" />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Modifica Identificazione camerale"
            onClick={() => openDrawer(SECTION_KEY)}
          >
            <PencilIcon className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {identificazione ? (
          <div className="grid grid-cols-2 gap-4">
            <DataRow label="Ragione sociale" value={identificazione.ragione_sociale} />
            <DataRow label="Forma giuridica" value={identificazione.forma_giuridica} />
            <DataRow label="Codice fiscale" value={identificazione.codice_fiscale} />
            <DataRow label="Partita IVA" value={identificazione.partita_iva} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nessun dato inserito ancora.</p>
        )}
        <Button variant="outline" className="w-full" onClick={() => openDrawer(SECTION_KEY)}>
          {compilata ? "Visualizza dettagli" : "Compila sezione"}
        </Button>
      </CardContent>
    </Card>
  );
}
