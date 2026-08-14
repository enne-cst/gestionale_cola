import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { ContrattoLavoro } from "@/lib/types/anagrafica-iso9001";

import { ContrattoLavoroForm } from "./form";

export default async function ContrattoLavoroPage() {
  const dati = await apiFetch<ContrattoLavoro | null>("/api/anagrafica/contratto-lavoro");
  const compilata = Boolean(dati?.ccnl_applicato);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["contratto-lavoro"]}
        title="Contratto di lavoro"
        subtitle="Contratto collettivo nazionale applicato dall'azienda."
        badge={<SectionStatusBadge compilata={compilata} />}
      />
      <ContrattoLavoroForm dati={dati} />
    </div>
  );
}
