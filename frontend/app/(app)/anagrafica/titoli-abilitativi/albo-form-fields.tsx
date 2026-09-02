"use client";

import { useState } from "react";

import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TitoloAbilitativoAlbo } from "@/lib/types/anagrafica";

import { getCatalogoTitoloAbilitativo } from "./actions";
import { AsyncCatalogSelectField } from "./async-catalog-select-field";
import { CampiComuniFields } from "./campi-comuni-fields";
import { SoggettoField } from "./soggetto-field";

export function AlboFormFields({ dati }: { dati?: TitoloAbilitativoAlbo }) {
  // "Denominazione dell'albo" (§ punto 2): compilata dal catalogo alla
  // scelta della tipologia, ma resta modificabile — l'auto-compilazione
  // scatta solo se il campo è ancora vuoto, mai sovrascrivendo un valore
  // già digitato o già salvato.
  const [denominazione, setDenominazione] = useState(dati?.denominazione_albo ?? "");

  return (
    <div className="flex flex-col gap-4">
      <AsyncCatalogSelectField
        label="Tipologia di albo"
        name="tipologia_albo_id"
        defaultValue={dati?.tipologia_albo_id}
        loader={() => getCatalogoTitoloAbilitativo("tipologie-albo")}
        onValueChange={(_value, denom) => {
          if (denominazione.trim() === "" && denom) setDenominazione(denom);
        }}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="denominazione_albo" className="text-muted-foreground">
          Denominazione dell&apos;albo
        </Label>
        <Input
          id="denominazione_albo"
          name="denominazione_albo"
          value={denominazione}
          onChange={(e) => setDenominazione(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Sezione" name="sezione" defaultValue={dati?.sezione} />
        <FormField label="Categoria / classe" name="categoria" defaultValue={dati?.categoria} />
        <FormField label="Provincia / ambito territoriale" name="provincia_ambito" defaultValue={dati?.provincia_ambito} />
      </div>
      <SoggettoField label="Soggetto iscritto" dati={dati?.persona} />
      <FormTextareaField
        label="Attività o abilitazioni collegate"
        name="attivita_abilitazioni"
        defaultValue={dati?.attivita_abilitazioni}
      />
      <CampiComuniFields
        dati={dati}
        etichettaNumero="Numero di iscrizione"
        etichettaEnte="Ente che gestisce l'albo"
        etichettaDataRilascio="Data di iscrizione"
      />
    </div>
  );
}
