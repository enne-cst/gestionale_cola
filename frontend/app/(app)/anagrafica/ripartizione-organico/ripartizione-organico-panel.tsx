"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getElencoIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { RipartizioneOrganico } from "@/lib/types/anagrafica-iso9001";

import { RipartizioneOrganicoTable } from "./ripartizione-organico-table";

export function RipartizioneOrganicoPanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<RipartizioneOrganico[] | null>(null);

  const refresh = useCallback(async () => {
    setDati(await getElencoIso9001<RipartizioneOrganico>("ripartizione-organico"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001["ripartizione-organico"]}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001["ripartizione-organico"]}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && <RipartizioneOrganicoTable dati={dati} onChanged={refresh} />}
    </ElencoSectionPanel>
  );
}
