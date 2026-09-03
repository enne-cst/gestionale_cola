"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getElencoIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { ComplianceTrasparenza } from "@/lib/types/anagrafica-iso9001";

import { ComplianceTable } from "./compliance-table";

export function CompliancePanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<ComplianceTrasparenza[] | null>(null);

  const refresh = useCallback(async () => {
    setDati(await getElencoIso9001<ComplianceTrasparenza>("compliance-trasparenza"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001["compliance-trasparenza"]}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001["compliance-trasparenza"]}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && <ComplianceTable dati={dati} onChanged={refresh} />}
    </ElencoSectionPanel>
  );
}
