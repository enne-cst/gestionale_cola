"use client";

import { useState, type ReactNode } from "react";

import { PeriodoSelect } from "@/components/periodo-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcolaGruppo } from "@/lib/personale-occupazione-calc";
import type { AddettiVisuraPeriodo } from "@/lib/types/anagrafica";

type RigaPeriodo = {
  periodo: string;
  numero_dipendenti: string;
  numero_indipendenti: string;
  numero_collaboratori: string;
  numero_totale_addetti: string;
  percentuale_tempo_determinato: string;
  percentuale_tempo_indeterminato: string;
  percentuale_tempo_pieno: string;
  percentuale_tempo_parziale: string;
  percentuale_apprendisti: string;
  percentuale_operai: string;
  percentuale_impiegati: string;
};

function rigaVuota(): RigaPeriodo {
  return {
    periodo: "",
    numero_dipendenti: "",
    numero_indipendenti: "",
    numero_collaboratori: "",
    numero_totale_addetti: "",
    percentuale_tempo_determinato: "",
    percentuale_tempo_indeterminato: "",
    percentuale_tempo_pieno: "",
    percentuale_tempo_parziale: "",
    percentuale_apprendisti: "",
    percentuale_operai: "",
    percentuale_impiegati: "",
  };
}

/** Un indicatore percentuale con accanto il numero di persone calcolato (§
 * Correzione 22 punto 5/10): i due campi hanno circa la stessa larghezza —
 * il campo percentuale è quindi più stretto di un campo numerico normale.
 * Il numero calcolato non è mai modificabile e si aggiorna immediatamente
 * (nessun salvataggio proprio: il suo stato deriva dai dati di origine). */
function PercentualeConCalcolo({
  label,
  name,
  value,
  onChange,
  numeroCalcolato,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (valore: string) => void;
  numeroCalcolato: number | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Input
            name={name}
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            className="pr-6"
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
            %
          </span>
        </div>
        <div
          className="flex h-9 items-center justify-between gap-1.5 rounded-md border border-input bg-[#eef3fb] px-2.5 text-sm text-[var(--az-ink-soft)]"
          title="Calcolato dalla percentuale e dal numero dei dipendenti"
        >
          <span className="font-semibold">{numeroCalcolato ?? "—"}</span>
          <span className="text-[9px] font-bold tracking-wide text-[#7c8fb3] uppercase">Calcolato</span>
        </div>
      </div>
    </div>
  );
}

function GruppoDistribuzione({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-[var(--az-ink)]">{titolo}</span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

/** Dati del periodo di una rilevazione "Addetti da visura": un solo periodo
 * per rilevazione, non una lista modificabile — inserire dati per un
 * periodo diverso corrisponde già di per sé a creare una nuova rilevazione
 * (§ "+ Nuova rilevazione" in cima alla sezione), non ad aggiungere una
 * seconda riga alla stessa. Il campo `periodi` lato backend resta un
 * array (`ana_addetti_visura_periodi`, 1:N) per non toccare lo schema
 * baseline, ma il form ne popola sempre e solo il primo elemento. */
export function PeriodiField({ dati }: { dati: AddettiVisuraPeriodo[] }) {
  const [riga, setRiga] = useState<RigaPeriodo>(() => {
    const p = dati[0];
    return p
      ? {
          periodo: p.periodo,
          numero_dipendenti: p.numero_dipendenti?.toString() ?? "",
          numero_indipendenti: p.numero_indipendenti?.toString() ?? "",
          numero_collaboratori: p.numero_collaboratori?.toString() ?? "",
          numero_totale_addetti: p.numero_totale_addetti?.toString() ?? "",
          percentuale_tempo_determinato: p.percentuale_tempo_determinato ?? "",
          percentuale_tempo_indeterminato: p.percentuale_tempo_indeterminato ?? "",
          percentuale_tempo_pieno: p.percentuale_tempo_pieno ?? "",
          percentuale_tempo_parziale: p.percentuale_tempo_parziale ?? "",
          percentuale_apprendisti: p.percentuale_apprendisti ?? "",
          percentuale_operai: p.percentuale_operai ?? "",
          percentuale_impiegati: p.percentuale_impiegati ?? "",
        }
      : rigaVuota();
  });

  function aggiorna(campo: keyof RigaPeriodo, valore: string) {
    setRiga((r) => ({ ...r, [campo]: valore }));
  }

  const contrattuale = calcolaGruppo(
    [riga.percentuale_tempo_determinato, riga.percentuale_tempo_indeterminato],
    riga.numero_dipendenti,
  );
  const orario = calcolaGruppo([riga.percentuale_tempo_pieno, riga.percentuale_tempo_parziale], riga.numero_dipendenti);
  const inquadramento = calcolaGruppo(
    [riga.percentuale_apprendisti, riga.percentuale_operai, riga.percentuale_impiegati],
    riga.numero_dipendenti,
  );

  return (
    <div className="flex flex-col gap-3">
      <Label>Periodo di rilevazione</Label>
      <div className="flex flex-col gap-4 rounded-md border border-border p-3.5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Periodo</Label>
            <PeriodoSelect name="vp_periodo" defaultValue={riga.periodo} className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Totale addetti</Label>
            <Input
              name="vp_numero_totale_addetti"
              type="number"
              min={0}
              value={riga.numero_totale_addetti}
              onChange={(e) => aggiorna("numero_totale_addetti", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Dipendenti</Label>
            <Input
              name="vp_numero_dipendenti"
              type="number"
              min={0}
              value={riga.numero_dipendenti}
              onChange={(e) => aggiorna("numero_dipendenti", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Indipendenti</Label>
            <Input
              name="vp_numero_indipendenti"
              type="number"
              min={0}
              value={riga.numero_indipendenti}
              onChange={(e) => aggiorna("numero_indipendenti", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Collaboratori</Label>
            <Input
              name="vp_numero_collaboratori"
              type="number"
              min={0}
              value={riga.numero_collaboratori}
              onChange={(e) => aggiorna("numero_collaboratori", e.target.value)}
            />
          </div>
        </div>

        <GruppoDistribuzione titolo="Distribuzione per tipologia contrattuale">
          <PercentualeConCalcolo
            label="Tempo determinato"
            name="vp_pct_determinato"
            value={riga.percentuale_tempo_determinato}
            onChange={(v) => aggiorna("percentuale_tempo_determinato", v)}
            numeroCalcolato={contrattuale.coerente ? contrattuale.numeri[0] : null}
          />
          <PercentualeConCalcolo
            label="Tempo indeterminato"
            name="vp_pct_indeterminato"
            value={riga.percentuale_tempo_indeterminato}
            onChange={(v) => aggiorna("percentuale_tempo_indeterminato", v)}
            numeroCalcolato={contrattuale.coerente ? contrattuale.numeri[1] : null}
          />
        </GruppoDistribuzione>

        <GruppoDistribuzione titolo="Distribuzione per orario di lavoro">
          <PercentualeConCalcolo
            label="Tempo pieno"
            name="vp_pct_pieno"
            value={riga.percentuale_tempo_pieno}
            onChange={(v) => aggiorna("percentuale_tempo_pieno", v)}
            numeroCalcolato={orario.coerente ? orario.numeri[0] : null}
          />
          <PercentualeConCalcolo
            label="Tempo parziale"
            name="vp_pct_parziale"
            value={riga.percentuale_tempo_parziale}
            onChange={(v) => aggiorna("percentuale_tempo_parziale", v)}
            numeroCalcolato={orario.coerente ? orario.numeri[1] : null}
          />
        </GruppoDistribuzione>

        <GruppoDistribuzione titolo="Distribuzione per inquadramento">
          <PercentualeConCalcolo
            label="Apprendisti"
            name="vp_pct_apprendisti"
            value={riga.percentuale_apprendisti}
            onChange={(v) => aggiorna("percentuale_apprendisti", v)}
            numeroCalcolato={inquadramento.coerente ? inquadramento.numeri[0] : null}
          />
          <PercentualeConCalcolo
            label="Operai"
            name="vp_pct_operai"
            value={riga.percentuale_operai}
            onChange={(v) => aggiorna("percentuale_operai", v)}
            numeroCalcolato={inquadramento.coerente ? inquadramento.numeri[1] : null}
          />
          <PercentualeConCalcolo
            label="Impiegati"
            name="vp_pct_impiegati"
            value={riga.percentuale_impiegati}
            onChange={(v) => aggiorna("percentuale_impiegati", v)}
            numeroCalcolato={inquadramento.coerente ? inquadramento.numeri[2] : null}
          />
        </GruppoDistribuzione>

        {!contrattuale.coerente && riga.percentuale_tempo_determinato !== "" && riga.percentuale_tempo_indeterminato !== "" && (
          <p className="text-xs text-destructive">
            Le percentuali di tipologia contrattuale non sommano a 100%: il numero di persone non viene calcolato.
          </p>
        )}
        {!orario.coerente && riga.percentuale_tempo_pieno !== "" && riga.percentuale_tempo_parziale !== "" && (
          <p className="text-xs text-destructive">
            Le percentuali di orario di lavoro non sommano a 100%: il numero di persone non viene calcolato.
          </p>
        )}
        {!inquadramento.coerente &&
          riga.percentuale_apprendisti !== "" &&
          riga.percentuale_operai !== "" &&
          riga.percentuale_impiegati !== "" && (
            <p className="text-xs text-destructive">
              Le percentuali di inquadramento non sommano a 100%: il numero di persone non viene calcolato.
            </p>
          )}
      </div>
    </div>
  );
}
