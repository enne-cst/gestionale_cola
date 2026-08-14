import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { AziendaAmministrazione } from "@/lib/types/superadmin";

import { rifiutaAzienda } from "./actions";
import { BloccaAziendaButton } from "./blocca-azienda-button";

/** Aziende con accesso attivo: "bloccare" riusa lo stesso stato
 * 'rifiutata' del rifiuto in fase di approvazione (vedi rifiutaAzienda in
 * ./actions) — get_current_azienda nega comunque l'accesso a qualunque
 * stato diverso da 'approvata', quindi non serve un terzo stato dedicato. */
export function AziendeApprovate({ aziende }: { aziende: AziendaAmministrazione[] }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Aziende attive</h2>
        <p className="text-sm text-muted-foreground">
          {aziende.length === 0 ? "Nessuna azienda approvata." : `${aziende.length} approvate.`}
        </p>
      </div>
      {aziende.length > 0 && (
        <table className="w-full max-w-3xl text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 font-medium">Ragione sociale</th>
              <th className="py-2 font-medium">P.IVA / C.F.</th>
              <th className="py-2 font-medium">Consulente</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {aziende.map((azienda) => (
              <tr key={azienda.id} className="border-b border-border">
                <td className="py-2 text-foreground">{azienda.ragione_sociale}</td>
                <td className="py-2 text-muted-foreground">{azienda.partita_iva ?? azienda.codice_fiscale ?? "—"}</td>
                <td className="py-2 text-muted-foreground">
                  {azienda.consulenti.length > 0
                    ? azienda.consulenti.map((c) => `${c.nome} ${c.cognome}`).join(", ")
                    : "—"}
                </td>
                <td className="py-2">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/superadmin/aziende/${azienda.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Abbonamenti
                    </Link>
                    <BloccaAziendaButton
                      action={rifiutaAzienda.bind(null, azienda.id)}
                      ragioneSociale={azienda.ragione_sociale}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
