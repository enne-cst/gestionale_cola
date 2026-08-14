import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { CatalogoVoce, Outsourcing } from "@/lib/types/anagrafica-iso9001";

import { OutsourcingTable } from "./outsourcing-table";

export default async function OutsourcingPage() {
  const [dati, stati] = await Promise.all([
    apiFetch<Outsourcing[]>("/api/anagrafica/outsourcing"),
    apiFetch<CatalogoVoce[]>("/api/anagrafica/cataloghi/stati-outsourcing"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE.outsourcing}
        title="Outsourcing"
        subtitle="Processi e attività che l'azienda affida a soggetti esterni."
        badge={<SectionStatusBadge compilata={dati.length > 0} />}
      />
      <OutsourcingTable dati={dati} stati={stati} />
    </div>
  );
}
