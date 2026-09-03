"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getCatalogoIso9001, getElencoIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { CatalogoVoce, LavoratoreAutonomo } from "@/lib/types/anagrafica-iso9001";

import { LavoratoriTable } from "./lavoratori-table";

export function LavoratoriPanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<{ dati: LavoratoreAutonomo[]; stati: CatalogoVoce[] } | null>(null);

  const refresh = useCallback(async () => {
    const [dati, stati] = await Promise.all([
      getElencoIso9001<LavoratoreAutonomo>("lavoratori-autonomi"),
      getCatalogoIso9001("stati-lavoratori-autonomi"),
    ]);
    setDati({ dati, stati });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001["lavoratori-autonomi"]}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001["lavoratori-autonomi"]}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && <LavoratoriTable dati={dati.dati} stati={dati.stati} onChanged={refresh} />}
    </ElencoSectionPanel>
  );
}
