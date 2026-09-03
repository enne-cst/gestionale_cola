"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getElencoIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { VariazioneOrganico } from "@/lib/types/anagrafica-iso9001";

import { VariazioniTable } from "./variazioni-table";

export function VariazioniPanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<VariazioneOrganico[] | null>(null);

  const refresh = useCallback(async () => {
    setDati(await getElencoIso9001<VariazioneOrganico>("variazioni-organico"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001["variazioni-organico"]}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001["variazioni-organico"]}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && <VariazioniTable dati={dati} onChanged={refresh} />}
    </ElencoSectionPanel>
  );
}
