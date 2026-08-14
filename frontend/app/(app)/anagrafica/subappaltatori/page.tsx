import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { CatalogoVoce, Subappaltatore } from "@/lib/types/anagrafica-iso9001";

import { SubappaltatoriTable } from "./subappaltatori-table";

export default async function SubappaltatoriPage() {
  const [dati, stati] = await Promise.all([
    apiFetch<Subappaltatore[]>("/api/anagrafica/subappaltatori"),
    apiFetch<CatalogoVoce[]>("/api/anagrafica/cataloghi/stati-subappaltatori"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE.subappaltatori}
        title="Subappaltatori"
        subtitle="Subappaltatori utilizzati dall'azienda."
        badge={<SectionStatusBadge compilata={dati.length > 0} />}
      />
      <SubappaltatoriTable dati={dati} stati={stati} />
    </div>
  );
}
