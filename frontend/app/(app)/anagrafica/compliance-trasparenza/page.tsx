import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { ComplianceTrasparenza } from "@/lib/types/anagrafica-iso9001";

import { ComplianceTable } from "./compliance-table";

export default async function ComplianceTrasparenzaPage() {
  const dati = await apiFetch<ComplianceTrasparenza[]>("/api/anagrafica/compliance-trasparenza");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["compliance-trasparenza"]}
        title="Compliance e trasparenza"
        subtitle="Documenti, modelli e adempimenti adottati dall'azienda in materia di compliance e trasparenza."
        badge={<SectionStatusBadge compilata={dati.length > 0} />}
      />
      <ComplianceTable dati={dati} />
    </div>
  );
}
