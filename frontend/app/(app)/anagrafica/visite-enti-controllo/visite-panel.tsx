"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getElencoIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { VisitaEnteControllo } from "@/lib/types/anagrafica-iso9001";

import { VisiteTable } from "./visite-table";

export function VisitePanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<VisitaEnteControllo[] | null>(null);

  const refresh = useCallback(async () => {
    setDati(await getElencoIso9001<VisitaEnteControllo>("visite-enti-controllo"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001["visite-enti-controllo"]}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001["visite-enti-controllo"]}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && <VisiteTable dati={dati} onChanged={refresh} />}
    </ElencoSectionPanel>
  );
}
