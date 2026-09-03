"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getCatalogoIso9001, getElencoIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { Assicurazione, CatalogoVoce } from "@/lib/types/anagrafica-iso9001";

import { AssicurazioniTable } from "./assicurazioni-table";

export function AssicurazioniPanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<{ dati: Assicurazione[]; stati: CatalogoVoce[]; frequenze: CatalogoVoce[] } | null>(
    null,
  );

  const refresh = useCallback(async () => {
    const [dati, stati, frequenze] = await Promise.all([
      getElencoIso9001<Assicurazione>("assicurazioni"),
      getCatalogoIso9001("stati-assicurazioni"),
      getCatalogoIso9001("frequenze-rinnovo-assicurazioni"),
    ]);
    setDati({ dati, stati, frequenze });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001.assicurazioni}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001.assicurazioni}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && <AssicurazioniTable dati={dati.dati} stati={dati.stati} frequenze={dati.frequenze} onChanged={refresh} />}
    </ElencoSectionPanel>
  );
}
