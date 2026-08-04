import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import type { AziendaAmministrazione, Consulente } from "@/lib/types/superadmin";

import { AssociaConsulenteForm } from "./associa-consulente-form";
import { AziendeInAttesa } from "./aziende-in-attesa";

export default async function SuperadminPage() {
  const [aziende, consulenti] = await Promise.all([
    apiFetch<AziendaAmministrazione[]>("/api/superadmin/aziende"),
    apiFetch<Consulente[]>("/api/superadmin/consulenti"),
  ]);

  const inAttesa = aziende.filter((azienda) => azienda.stato_approvazione === "in_attesa");

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        icon={ShieldCheck}
        title="Area super admin"
        subtitle="Approva le aziende create dai consulenti e associa aziende esistenti a un consulente"
        size="lg"
      />

      <AziendeInAttesa aziende={inAttesa} />
      <AssociaConsulenteForm aziende={aziende} consulenti={consulenti} />
    </div>
  );
}
