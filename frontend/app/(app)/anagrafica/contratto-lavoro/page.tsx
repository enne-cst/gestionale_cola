import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { ContrattoLavoro } from "@/lib/types/anagrafica-iso9001";

import { ContrattoLavoroForm } from "./form";

export default async function ContrattoLavoroPage() {
  const dati = await apiFetch<ContrattoLavoro | null>("/api/anagrafica/contratto-lavoro");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["contratto-lavoro"]}
        title="Contratto di lavoro"
        subtitle="Contratto collettivo nazionale applicato dall'azienda."
      />
      <ContrattoLavoroForm dati={dati} />
    </div>
  );
}
