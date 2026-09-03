"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getCatalogoIso9001, getElencoIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { CatalogoVoce, FondoInterprofessionale } from "@/lib/types/anagrafica-iso9001";

import { FondiTable } from "./fondi-table";

/** Pannello del drawer/affiancamento/scheda del workspace per "Fondi
 * interprofessionali" (§ "falle tutte"): a differenza delle sezioni a
 * registro campo-per-campo, i dati non vivono in `useWorkspace().state`
 * (righe multiple, non un singolo record per azienda) — caricati qui con
 * lo stesso principio (fetch lato client all'apertura, `ensureLoaded` in
 * `SectionContent`), stato locale invece che nel reducer condiviso perché
 * nessun'altra card ha bisogno di questi dati. */
export function FondiPanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<{ fondi: FondoInterprofessionale[]; stati: CatalogoVoce[] } | null>(null);

  const refresh = useCallback(async () => {
    const [fondi, stati] = await Promise.all([
      getElencoIso9001<FondoInterprofessionale>("fondi-interprofessionali"),
      getCatalogoIso9001("stati-iscrizione-fondo"),
    ]);
    setDati({ fondi, stati });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001["fondi-interprofessionali"]}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001["fondi-interprofessionali"]}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && <FondiTable fondi={dati.fondi} statiIscrizione={dati.stati} onChanged={refresh} />}
    </ElencoSectionPanel>
  );
}
