"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiResource } from "@/lib/actions/api-resource";
import { getRegistroSezione } from "@/lib/actions/registro";
import { cn } from "@/lib/utils";
import type { AttivitaEsercitata } from "@/lib/types/anagrafica";
import type { FieldState, Section } from "@/lib/types/registro";

function campoDa(sezione: Section | null, chiave: string): FieldState | undefined {
  return sezione?.groups.flatMap((g) => g.fields).find((f) => f.key === chiave);
}

function testoBooleano(valore: string | null | undefined): string {
  if (valore === "true") return "Sì";
  if (valore === "false") return "No";
  return "Non disponibile";
}

type Voce = { label: string; valore: string; fonte: string };

type Stato = { fase: "loading" } | { fase: "error" } | { fase: "ok"; voci: Voce[] };

/** Sezione 0 "Dati della sintesi non presenti nelle sezioni successive"
 * (mappatura CCIAA §0): vista di sola lettura che aggrega valori già
 * autorevoli in altre sezioni/tabelle, senza copie proprie (§0.1) — solo
 * gli indicatori "impresa in cifre" (§0.4) sono editabili altrove
 * (drawer "Informazioni societarie") e qui mostrati in sola lettura. */
export function SintesiPanel() {
  const [stato, setStato] = useState<Stato>({ fase: "loading" });

  const carica = useCallback(() => {
    setStato({ fase: "loading" });
    Promise.all([
      getRegistroSezione("informazioni-societarie"),
      getRegistroSezione("amministrazione-controllo"),
      getApiResource<AttivitaEsercitata | null>("/api/anagrafica/attivita-esercitata"),
    ])
      .then(([informazioniSocietarie, amministrazioneControllo, attivitaEsercitata]) => {
        const voci: Voce[] = [
          {
            label: "Stato attività dell'impresa",
            valore: campoDa(informazioniSocietarie, "stato_attivita")?.value ?? "Non disponibile",
            fonte: "Informazioni societarie",
          },
          {
            label: "Codice NACE",
            valore: campoDa(informazioniSocietarie, "codice_nace")?.value ?? "Non disponibile",
            fonte: "Attività esercitata (codici ATECO)",
          },
          {
            label: "Attività import/export",
            valore:
              attivitaEsercitata?.presenza_attivita_import_export === true
                ? "Sì"
                : attivitaEsercitata?.presenza_attivita_import_export === false
                  ? "No"
                  : "Non disponibile",
            fonte: "Attività esercitata",
          },
          {
            label: "Numero titolari di cariche",
            valore: campoDa(amministrazioneControllo, "numero_titolari_cariche")?.value ?? "Non disponibile",
            fonte: "Amministrazione e controllo",
          },
          {
            label: "Pratiche inviate ultimi 12 mesi",
            valore: campoDa(informazioniSocietarie, "pratiche_ultimi_12_mesi")?.value ?? "Non disponibile",
            fonte: "Informazioni societarie",
          },
          {
            label: "Trasferimenti di quote",
            valore: campoDa(informazioniSocietarie, "trasferimenti_quote")?.value ?? "Non disponibile",
            fonte: "Informazioni societarie",
          },
          {
            label: "Trasferimenti di sede",
            valore: campoDa(informazioniSocietarie, "trasferimenti_sede")?.value ?? "Non disponibile",
            fonte: "Informazioni societarie",
          },
          {
            label: "Partecipazioni in altre società",
            valore: testoBooleano(campoDa(informazioniSocietarie, "partecipazioni_altre_societa")?.value),
            fonte: "Informazioni societarie",
          },
        ];
        setStato({ fase: "ok", voci });
      })
      .catch(() => setStato({ fase: "error" }));
  }, []);

  useEffect(() => {
    carica();
  }, [carica]);

  return (
    <section className="py-2">
      <p className="mb-4 text-sm text-[#536a9f]">
        Riepilogo di sola lettura: ogni valore è compilato e verificato nella sezione indicata come fonte, non qui.
        Gli indicatori &quot;impresa in cifre&quot; si modificano dal drawer &quot;Informazioni societarie&quot;.
      </p>

      {stato.fase === "loading" && (
        <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="az-skeleton h-12 w-full" />
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

      {stato.fase === "ok" && (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stato.voci.map((voce) => (
            <div key={voce.label} className={cn("rounded-[7px] border border-[var(--az-border)] p-3")}>
              <dt className="text-[13px] font-medium text-[#536a9f]">{voce.label}</dt>
              <dd className="mt-1 text-sm font-bold text-[var(--az-ink)]">{voce.valore}</dd>
              <p className="mt-1 text-xs text-[var(--az-muted)]">Fonte: {voce.fonte}</p>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
