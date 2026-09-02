"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TitoloAbilitativoSoaCategoriaVoce } from "@/lib/types/anagrafica";

import { getCatalogoTitoloAbilitativo } from "./actions";
import { AsyncCatalogSelectField } from "./async-catalog-select-field";

let nextKey = 0;

function rigaVuota() {
  return { key: nextKey++, categoria_soa_id: "", classifica_soa_id: "" };
}

/** Tabella ripetibile "Categorie e classifiche" del sotto-form "Attestazione
 * SOA" (§ punto 5.2): una sola attestazione collegata a più categorie senza
 * duplicare numero/ente/date (già campi comuni della riga principale). Ogni
 * riga invia una coppia `soa_categoria_id`/`soa_classifica_id`, lette lato
 * server con `formData.getAll` allineate per indice — stesso pattern già in
 * uso per le categorie SOA della pagina standalone `/anagrafica/soa`. */
export function SoaCategorieField({ dati }: { dati?: TitoloAbilitativoSoaCategoriaVoce[] }) {
  const [righe, setRighe] = useState(() =>
    dati && dati.length > 0
      ? dati.map((c) => ({ key: nextKey++, categoria_soa_id: c.categoria_soa_id, classifica_soa_id: c.classifica_soa_id ?? "" }))
      : [rigaVuota()],
  );

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground">Categorie e classifiche</Label>
      <div className="flex flex-col gap-2">
        {righe.map((riga) => (
          <div key={riga.key} className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
            <AsyncCatalogSelectField
              label="Categoria SOA"
              name="soa_categoria_id"
              defaultValue={riga.categoria_soa_id}
              loader={() => getCatalogoTitoloAbilitativo("categorie-soa")}
              placeholder="Nessuna categoria in catalogo"
            />
            <AsyncCatalogSelectField
              label="Classifica"
              name="soa_classifica_id"
              defaultValue={riga.classifica_soa_id}
              loader={() => getCatalogoTitoloAbilitativo("classifiche-soa")}
            />
            <div className="flex justify-end sm:col-span-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Rimuovi categoria"
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
          Aggiungi categoria
        </Button>
      </div>
    </div>
  );
}
