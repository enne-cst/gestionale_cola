"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getElencoIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { DatiGenerali } from "@/lib/types/anagrafica-iso9001";

import { DatiGeneraliTable } from "./dati-generali-table";

export function DatiGeneraliPanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<DatiGenerali[] | null>(null);

  const refresh = useCallback(async () => {
    setDati(await getElencoIso9001<DatiGenerali>("dati-generali"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001["dati-generali"]}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001["dati-generali"]}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && <DatiGeneraliTable dati={dati} onChanged={refresh} />}
    </ElencoSectionPanel>
  );
}
