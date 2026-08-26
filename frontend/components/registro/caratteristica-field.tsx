"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CaratteristicaRuolo, ValoreIncarico } from "@/lib/types/personale";

/** Un campo del form dinamico di un incarico (§2.5 della specifica CCIAA:
 * il controllo si sceglie dal tipo del dato, mai a mano per singolo campo).
 * Riflette esattamente `_TIPO_COLONNA`/`_coerce_valore` di
 * `backend/app/core/incarichi.py`: stesso insieme di tipi, stessa idea che
 * un solo controllo è valido per tipo, non duplicato qui in una forma
 * diversa. */
export function CaratteristicaField({
  caratteristica,
  value,
  onChange,
}: {
  caratteristica: CaratteristicaRuolo;
  value: ValoreIncarico;
  onChange: (value: ValoreIncarico) => void;
}) {
  const id = `caratteristica-${caratteristica.id}`;
  const obbligatoria = caratteristica.obbligatorieta === "OBBLIGATORIA";
  const label = (
    <Label htmlFor={id} className="text-xs font-semibold text-[#43588e]">
      {caratteristica.denominazione}
      {obbligatoria && <span className="text-destructive"> *</span>}
    </Label>
  );

  if (caratteristica.tipoDato === "BOOLEANO") {
    return (
      <div className="flex items-center gap-2 pt-5">
        <Checkbox id={id} checked={value === true} onCheckedChange={(checked) => onChange(checked === true)} />
        <Label htmlFor={id} className="text-sm font-normal">
          {caratteristica.denominazione}
        </Label>
      </div>
    );
  }

  if (caratteristica.tipoDato === "TESTO_LUNGO") {
    return (
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        {label}
        <Textarea id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} required={obbligatoria} />
      </div>
    );
  }

  if (caratteristica.tipoDato === "CATALOGO" && caratteristica.valoriAmmessi) {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <Select value={(value as string) ?? undefined} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Seleziona…" />
          </SelectTrigger>
          <SelectContent>
            {caratteristica.valoriAmmessi.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (caratteristica.tipoDato === "NUMERO") {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <Input
          id={id}
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={obbligatoria}
        />
      </div>
    );
  }

  if (caratteristica.tipoDato === "DATA") {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <Input
          id={id}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={obbligatoria}
        />
      </div>
    );
  }

  // TESTO, CATALOGO senza valori ammessi definiti, DOCUMENTO (riferimento
  // testuale: la gestione documentale vera e propria non è in ambito qui).
  return (
    <div className="flex flex-col gap-1.5">
      {label}
      <Input id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} required={obbligatoria} />
    </div>
  );
}
