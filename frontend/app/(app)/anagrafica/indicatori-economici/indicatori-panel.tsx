"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getElencoIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { IndicatoreEconomico } from "@/lib/types/anagrafica-iso9001";

import { IndicatoriTable } from "./indicatori-table";

export function IndicatoriPanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<IndicatoreEconomico[] | null>(null);

  const refresh = useCallback(async () => {
    setDati(await getElencoIso9001<IndicatoreEconomico>("indicatori-economici"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001["indicatori-economici"]}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001["indicatori-economici"]}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && <IndicatoriTable dati={dati} onChanged={refresh} />}
    </ElencoSectionPanel>
  );
}
