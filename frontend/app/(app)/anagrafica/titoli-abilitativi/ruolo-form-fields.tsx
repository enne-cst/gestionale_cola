"use client";

import { useState } from "react";

import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TitoloAbilitativoRuolo } from "@/lib/types/anagrafica";

import { getCatalogoTitoloAbilitativo } from "./actions";
import { AsyncCatalogSelectField } from "./async-catalog-select-field";
import { CampiComuniFields } from "./campi-comuni-fields";
import { SoggettoField } from "./soggetto-field";

export function RuoloFormFields({ dati }: { dati?: TitoloAbilitativoRuolo }) {
  // "Denominazione del ruolo o qualifica" (§ punto 3): stesso comportamento
  // di "Denominazione dell'albo" — compilata dalla tipologia se ancora vuota.
  const [denominazione, setDenominazione] = useState(dati?.denominazione_ruolo ?? "");

  return (
    <div className="flex flex-col gap-4">
      <AsyncCatalogSelectField
        label="Tipologia di ruolo"
        name="tipologia_ruolo_id"
        defaultValue={dati?.tipologia_ruolo_id}
        loader={() => getCatalogoTitoloAbilitativo("tipologie-ruolo")}
        onValueChange={(_value, denom) => {
          if (denominazione.trim() === "" && denom) setDenominazione(denom);
        }}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="denominazione_ruolo" className="text-muted-foreground">
          Denominazione del ruolo o qualifica
        </Label>
        <Input
          id="denominazione_ruolo"
          name="denominazione_ruolo"
          value={denominazione}
          onChange={(e) => setDenominazione(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Sezione / categoria" name="sezione_categoria" defaultValue={dati?.sezione_categoria} />
        <FormField label="Provincia / ambito territoriale" name="provincia_ambito" defaultValue={dati?.provincia_ambito} />
      </div>
      <SoggettoField label="Titolare del ruolo" dati={dati?.persona} />
      <FormTextareaField label="Attività abilitate" name="attivita_abilitate" defaultValue={dati?.attivita_abilitate} />
      <CampiComuniFields
        dati={dati}
        etichettaNumero="Numero di iscrizione"
        etichettaEnte="Ente competente"
        etichettaDataRilascio="Data di iscrizione o attribuzione"
      />
    </div>
  );
}
