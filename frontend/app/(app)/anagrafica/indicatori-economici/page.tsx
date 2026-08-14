import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { IndicatoreEconomico } from "@/lib/types/anagrafica-iso9001";

import { IndicatoriTable } from "./indicatori-table";

export default async function IndicatoriEconomiciPage() {
  const dati = await apiFetch<IndicatoreEconomico[]>("/api/anagrafica/indicatori-economici");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["indicatori-economici"]}
        title="Indicatori economici"
        subtitle="Andamento annuale di fatturato e obiettivo. Lo scostamento è calcolato automaticamente."
        badge={<SectionStatusBadge compilata={dati.length > 0} />}
      />
      <IndicatoriTable dati={dati} />
    </div>
  );
}
