"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ElencoSectionPanel } from "@/components/registro/elenco-section-panel";
import { getElencoIso9001, getSingletonIso9001 } from "@/lib/actions/anagrafica-iso9001-verifica";
import { SOTTOTITOLO_ELENCO_ISO9001, TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import type { ContrattiRetePresenza, ContrattoRete } from "@/lib/types/anagrafica-iso9001";

import { ContrattiTable } from "./contratti-table";
import { PresenzaForm } from "./presenza-form";

/** § "falle tutte": unico pannello del drawer per "Contratti di rete",
 * che combina la presenza (singleton booleano, senza verifica per riga —
 * un solo campo Sì/No non porta con sé lo stesso concetto di "record da
 * confermare") con l'elenco dei contratti (verifica per riga, come le
 * altre 13 sezioni a elenco). Stesso pattern di `PersonaleOccupazionePanel`
 * per unire più fonti in un solo banner, qui semplificato perché non c'è un
 * banner di modifica condiviso: ciascun blocco salva subito, come già
 * faceva la pagina dedicata. */
export function ContrattiRetePanel({ headerActions, onClose }: { headerActions?: ReactNode; onClose?: () => void }) {
  const [dati, setDati] = useState<{ presenza: ContrattiRetePresenza | null; contratti: ContrattoRete[] } | null>(
    null,
  );

  const refresh = useCallback(async () => {
    const [presenza, contratti] = await Promise.all([
      getSingletonIso9001<ContrattiRetePresenza | null>("contratti-rete/presenza"),
      getElencoIso9001<ContrattoRete>("contratti-rete"),
    ]);
    setDati({ presenza, contratti });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElencoSectionPanel
      title={TITOLO_ELENCO_ISO9001["contratti-rete"]}
      subtitle={SOTTOTITOLO_ELENCO_ISO9001["contratti-rete"]}
      headerActions={headerActions}
      onClose={onClose}
      loading={!dati}
    >
      {dati && (
        <div className="flex flex-col gap-6">
          <PresenzaForm dati={dati.presenza} onSaved={refresh} />
          <ContrattiTable dati={dati.contratti} onChanged={refresh} />
        </div>
      )}
    </ElencoSectionPanel>
  );
}
