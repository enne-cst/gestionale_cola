"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getCatalogoIso9001, getElencoIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { CatalogoVoce, ProcedimentoLegale } from "@/lib/types/anagrafica-iso9001";

import { ProcedimentiTable } from "./procedimenti-table";

export function ProcedimentiPanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<{ dati: ProcedimentoLegale[]; stati: CatalogoVoce[] } | null>(null);

  const refresh = useCallback(async () => {
    const [dati, stati] = await Promise.all([
      getElencoIso9001<ProcedimentoLegale>("procedimenti-legali"),
      getCatalogoIso9001("stati-procedimenti-legali"),
    ]);
    setDati({ dati, stati });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001["procedimenti-legali"]}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001["procedimenti-legali"]}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && <ProcedimentiTable dati={dati.dati} stati={dati.stati} onChanged={refresh} />}
    </ElencoSectionPanel>
  );
}
