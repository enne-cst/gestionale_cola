"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import type { AziendaAmministrazione, Consulente } from "@/lib/types/superadmin";

import { associaConsulente, type AssociaConsulenteState } from "./actions";

// Select nativo, non il componente shadcn: deve inviare il proprio valore
// via FormData in una server action senza stato client aggiuntivo (stesso
// motivo di components/periodo-select.tsx).
const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function AssociaConsulenteForm({
  aziende,
  consulenti,
}: {
  aziende: AziendaAmministrazione[];
  consulenti: Consulente[];
}) {
  const [state, formAction] = useActionState<AssociaConsulenteState, FormData>(associaConsulente, {});

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Associa un&apos;azienda a un consulente</h2>
        <p className="text-sm text-muted-foreground">
          Per aziende già esistenti (es. senza consulente assegnato) che un consulente non può prendere da sé.
        </p>
      </div>

      <form action={formAction} className="flex max-w-xl flex-col gap-4">
        <FormError message={state.error} />
        {state.success && (
          <p className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
            Associazione creata.
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="azienda_id">Azienda</Label>
          <select id="azienda_id" name="azienda_id" required defaultValue="" className={SELECT_CLASS}>
            <option value="" disabled>
              Seleziona un&apos;azienda…
            </option>
            {aziende.map((azienda) => (
              <option key={azienda.id} value={azienda.id}>
                {azienda.ragione_sociale} ({azienda.stato_approvazione}
                {azienda.consulenti.length > 0
                  ? `, consulente: ${azienda.consulenti.map((c) => `${c.nome} ${c.cognome}`).join(", ")}`
                  : ", nessun consulente"}
                )
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="consulente_id">Consulente</Label>
          <select id="consulente_id" name="consulente_id" required defaultValue="" className={SELECT_CLASS}>
            <option value="" disabled>
              Seleziona un consulente…
            </option>
            {consulenti.map((consulente) => (
              <option key={consulente.id} value={consulente.id}>
                {consulente.cognome} {consulente.nome} ({consulente.email})
              </option>
            ))}
          </select>
        </div>

        <SubmitButton>Associa</SubmitButton>
      </form>
    </section>
  );
}
