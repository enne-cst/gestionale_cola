import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { AziendaAmministrazione } from "@/lib/types/superadmin";

import { approvaAzienda, rifiutaAzienda } from "./actions";
import { RifiutaButton } from "./rifiuta-button";

export function AziendeInAttesa({ aziende }: { aziende: AziendaAmministrazione[] }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Aziende in attesa di approvazione</h2>
        <p className="text-sm text-muted-foreground">
          {aziende.length === 0 ? "Nessuna azienda in attesa." : `${aziende.length} in attesa.`}
        </p>
      </div>
      {aziende.length > 0 && (
        <table className="w-full max-w-3xl text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 font-medium">Ragione sociale</th>
              <th className="py-2 font-medium">P.IVA / C.F.</th>
              <th className="py-2 font-medium">Consulente</th>
              <th className="py-2 font-medium">Creata il</th>
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
                <td className="py-2 text-muted-foreground">{formatDate(azienda.created_at)}</td>
                <td className="py-2">
                  <div className="flex items-center justify-end gap-2">
                    <form action={approvaAzienda.bind(null, azienda.id)}>
                      <Button type="submit" size="sm">
                        Approva
                      </Button>
                    </form>
                    <RifiutaButton
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
