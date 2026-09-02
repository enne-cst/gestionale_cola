"use client";

import { useCallback, useEffect, useState } from "react";

import type { IndicatoriAggiornamentoImpresa } from "@/lib/types/anagrafica";

import { getIndicatoriAggiornamentoImpresa } from "./actions";

type Stato =
  | { fase: "loading" }
  | { fase: "error" }
  | { fase: "ok"; indicatori: IndicatoriAggiornamentoImpresa };

function CampoIndicatore({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex h-full min-h-[74px] flex-col justify-center gap-1 rounded-md border border-[var(--az-border)] bg-white px-3.5 py-2.5">
      <span className="text-[10px] font-semibold text-[var(--az-muted)]">{label}</span>
      <span className="text-xl font-extrabold text-[var(--az-ink)]">{value}</span>
    </div>
  );
}

/** Indicatori riepilogativi (§1/§2): sempre calcolati dal backend dalle
 * relative tabelle, mai un numero fisso nel frontend — a differenza del
 * vecchio pannello ("Partecipazioni (2)"), l'etichetta non contiene mai il
 * numero: il valore compare solo nel campo, come per gli altri tre. */
export function IndicatoriAggiornamentoImpresaRow() {
  const [stato, setStato] = useState<Stato>({ fase: "loading" });

  const carica = useCallback(() => {
    setStato({ fase: "loading" });
    getIndicatoriAggiornamentoImpresa()
      .then((indicatori) => setStato({ fase: "ok", indicatori }))
      .catch(() => setStato({ fase: "error" }));
  }, []);

  useEffect(() => {
    carica();
  }, [carica]);

  if (stato.fase === "loading") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="status" aria-live="polite" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="az-skeleton h-[74px] w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (stato.fase === "error") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        <span>Impossibile caricare gli indicatori.</span>
        <button type="button" onClick={carica} className="font-semibold underline">
          Riprova
        </button>
      </div>
    );
  }

  const { indicatori } = stato;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <CampoIndicatore label="Pratiche negli ultimi 12 mesi" value={indicatori.pratiche_ultimi_12_mesi} />
      <CampoIndicatore label="Trasferimenti di quote" value={indicatori.trasferimenti_quote} />
      <CampoIndicatore label="Trasferimenti di sede" value={indicatori.trasferimenti_sede} />
      <CampoIndicatore label="Partecipazioni" value={indicatori.partecipazioni} />
    </div>
  );
}
