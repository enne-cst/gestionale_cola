"use client";

import { RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { getApiResource } from "@/lib/actions/api-resource";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { recordIdsFissati } from "@/lib/panoramica-helpers";
import { cn } from "@/lib/utils";

type Stato<T> =
  | { fase: "loading" }
  | { fase: "error" }
  | { fase: "ok"; items: T[]; recordIdsInPanoramica: string[] };

/** Blocco "tabella incorporata" del pannello CCIAA (§9 del protocollo): carica
 * client-side gli stessi dati della pagina standalone corrispondente (stesso
 * endpoint, stessa lista di voci fissate in Panoramica) e li passa al
 * componente tabella già esistente di quella pagina — nessuna duplicazione
 * di logica di fetch o di rendering, solo un contenitore diverso.
 *
 * Nota d'uso: dopo aver aggiunto/modificato/eliminato una riga dal dialogo
 * della tabella incorporata, il salvataggio sul server è immediato, ma
 * questo blocco non se ne accorge da solo (i dialoghi esistenti non espongono
 * un callback di successo, sono pensati per una pagina intera che si
 * ricarica da sé) — usare "Aggiorna" per vedere la riga nella lista. La
 * pagina standalone della sezione mostra sempre il dato più recente. */
export function EmbeddedResourceBlock<T>({
  title,
  apiPath,
  panoramicaSlug,
  children,
}: {
  title: string;
  apiPath: string;
  panoramicaSlug: string;
  children: (items: T[], recordIdsInPanoramica: string[]) => ReactNode;
}) {
  const [stato, setStato] = useState<Stato<T>>({ fase: "loading" });

  const carica = useCallback(() => {
    setStato({ fase: "loading" });
    Promise.all([getApiResource<T[]>(apiPath), getVociPanoramica(MODULO_ANAGRAFICA)])
      .then(([items, voci]) =>
        setStato({ fase: "ok", items, recordIdsInPanoramica: recordIdsFissati(voci, panoramicaSlug) }),
      )
      .catch(() => setStato({ fase: "error" }));
  }, [apiPath, panoramicaSlug]);

  useEffect(() => {
    carica();
  }, [carica]);

  return (
    <section className="border-b border-[var(--az-border)] py-6 last:border-b-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold text-[var(--az-ink)]">{title}</h3>
        <button
          type="button"
          onClick={carica}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]",
            stato.fase === "loading" && "opacity-50",
          )}
          disabled={stato.fase === "loading"}
        >
          <RefreshCwIcon className={cn("size-3.5", stato.fase === "loading" && "animate-spin")} />
          Aggiorna
        </button>
      </div>

      {stato.fase === "loading" && (
        <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="az-skeleton h-9 w-full" />
          ))}
        </div>
      )}

      {stato.fase === "error" && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <span>Impossibile caricare i dati.</span>
          <button type="button" onClick={carica} className="font-semibold underline">
            Riprova
          </button>
        </div>
      )}

      {stato.fase === "ok" && children(stato.items, stato.recordIdsInPanoramica)}
    </section>
  );
}
