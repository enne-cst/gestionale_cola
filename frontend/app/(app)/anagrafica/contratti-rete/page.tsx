import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { ContrattiRetePresenza, ContrattoRete } from "@/lib/types/anagrafica-iso9001";

import { ContrattiTable } from "./contratti-table";
import { PresenzaForm } from "./presenza-form";

export default async function ContrattiRetePage() {
  const [presenza, contratti] = await Promise.all([
    apiFetch<ContrattiRetePresenza | null>("/api/anagrafica/contratti-rete/presenza"),
    apiFetch<ContrattoRete[]>("/api/anagrafica/contratti-rete"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["contratti-rete"]}
        title="Contratti di rete"
        subtitle="Adesione dell'azienda a reti d'impresa e relativi contratti."
      />
      <PresenzaForm dati={presenza} />
      <ContrattiTable dati={contratti} />
    </div>
  );
}
