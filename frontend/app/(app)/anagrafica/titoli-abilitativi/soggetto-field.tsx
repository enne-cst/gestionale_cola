"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import { PersonaPicker, type PersonaLike } from "@/components/registro/persona-picker";

/** "Soggetto iscritto"/"Titolare del ruolo"/"Soggetto titolare" (§ punto
 * 2/3/4): azienda oppure persona collegata (mai duplicata, riferisce sempre
 * `ana_persone`). Nessuna persona selezionata = l'azienda stessa
 * (`persona_id` inviato vuoto). */
export function SoggettoField({ label, dati }: { label: string; dati?: PersonaLike | null }) {
  const [tipo, setTipo] = useState<"AZIENDA" | "PERSONA">(dati ? "PERSONA" : "AZIENDA");
  const [persona, setPersona] = useState<PersonaLike | null>(dati ?? null);

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      <div className="flex gap-4 text-sm text-[var(--az-ink)]">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={tipo === "AZIENDA"}
            onChange={() => {
              setTipo("AZIENDA");
              setPersona(null);
            }}
          />
          Azienda
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={tipo === "PERSONA"} onChange={() => setTipo("PERSONA")} />
          Persona
        </label>
      </div>
      {tipo === "PERSONA" && <PersonaPicker value={persona} onChange={setPersona} />}
      <input type="hidden" name="persona_id" value={persona?.id ?? ""} />
    </div>
  );
}
