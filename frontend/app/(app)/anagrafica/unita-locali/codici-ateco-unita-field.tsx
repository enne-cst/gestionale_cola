"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UnitaLocaleCodiceAteco } from "@/lib/types/anagrafica";

import { getCatalogoUnitaLocali } from "./actions";
import { AsyncCatalogSelectField } from "./async-catalog-select-field";

let nextKey = 0;

function rigaVuota() {
  return { key: nextKey++, codice_attivita_id: "", principale: false, data_inizio: "", data_fine: "" };
}

/** Codici ATECO dell'unità locale (§ punto 6): collegati al catalogo
 * versionato `cat_codici_ateco_2025` (Correzione 19), mai testo libero — al
 * più un codice principale, mostrato per primo nella tabella riepilogativa,
 * gli altri sintetizzati come indicatore aggiuntivo. Il catalogo nasce
 * vuoto (import ufficiale fuori scopo, § Correzione 19): il menu resta
 * senza opzioni finché non viene popolato. */
export function CodiciAtecoUnitaField({ dati }: { dati?: UnitaLocaleCodiceAteco[] }) {
  const [righe, setRighe] = useState(() =>
    dati && dati.length > 0
      ? dati.map((c) => ({
          key: nextKey++,
          codice_attivita_id: c.codice_attivita_id,
          principale: c.principale,
          data_inizio: c.data_inizio ?? "",
          data_fine: c.data_fine ?? "",
        }))
      : [],
  );

  function impostaPrincipale(key: number, valore: boolean) {
    setRighe((r) => r.map((riga) => (riga.key === key ? { ...riga, principale: valore } : riga)));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground">Codici ATECO</Label>
      <div className="flex flex-col gap-2">
        {righe.map((riga) => (
          <div key={riga.key} className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
            <AsyncCatalogSelectField
              label="Codice ATECO 2025"
              name="ateco_codice_id"
              defaultValue={riga.codice_attivita_id}
              loader={() => getCatalogoUnitaLocali("codici-ateco")}
              placeholder="Nessun codice in catalogo"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
              <Input name="ateco_data_inizio" type="date" defaultValue={riga.data_inizio} />
              <Input name="ateco_data_fine" type="date" defaultValue={riga.data_fine} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--az-ink)]">
              <Checkbox checked={riga.principale} onCheckedChange={(v) => impostaPrincipale(riga.key, v === true)} />
              Codice principale
              <input type="hidden" name="ateco_principale" value={riga.principale ? "true" : "false"} />
            </label>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Rimuovi codice ATECO"
                onClick={() => setRighe((r) => r.filter((x) => x.key !== riga.key))}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => setRighe((r) => [...r, rigaVuota()])}>
          <PlusIcon className="size-4" />
          Aggiungi codice ATECO
        </Button>
      </div>
    </div>
  );
}
