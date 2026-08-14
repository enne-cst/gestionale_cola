import { Building2 } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { entraInAzienda } from "@/lib/actions/azienda-attiva";
import { apiFetch } from "@/lib/api";
import type { AziendaCliente } from "@/lib/types/consulente";

const ETICHETTE_STATO: Record<AziendaCliente["stato_approvazione"], string> = {
  in_attesa: "In attesa di approvazione",
  approvata: "Approvata",
  rifiutata: "Rifiutata",
};

export default async function ConsulentePage() {
  const aziende = await apiFetch<AziendaCliente[]>("/api/consulente/aziende");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={Building2}
        title="Area consulente"
        subtitle="Crea e gestisci gli account delle aziende clienti"
        size="lg"
      />
      <Link href="/consulente/nuova-azienda" className={buttonVariants({ className: "w-fit" })}>
        Crea nuova azienda
      </Link>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Le tue aziende clienti</h2>
          <p className="text-sm text-muted-foreground">
            {aziende.length === 0 ? "Nessuna azienda associata." : `${aziende.length} associate.`}
          </p>
        </div>
        {aziende.length > 0 && (
          <table className="w-full max-w-2xl text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 font-medium">Ragione sociale</th>
                <th className="py-2 font-medium">Stato</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {aziende.map((azienda) => (
                <tr key={azienda.id} className="border-b border-border">
                  <td className="py-2 text-foreground">{azienda.ragione_sociale}</td>
                  <td className="py-2 text-muted-foreground">{ETICHETTE_STATO[azienda.stato_approvazione]}</td>
                  <td className="py-2">
                    <div className="flex justify-end gap-2">
                      <Link href={`/consulente/aziende/${azienda.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Abbonamenti
                      </Link>
                      {azienda.stato_approvazione === "approvata" && (
                        <form action={entraInAzienda.bind(null, azienda.id)}>
                          <Button type="submit" size="sm">
                            Entra
                          </Button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
