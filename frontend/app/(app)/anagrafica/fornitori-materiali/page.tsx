import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { CatalogoVoce, FornitoreMateriali } from "@/lib/types/anagrafica-iso9001";

import { FornitoriTable } from "./fornitori-table";

export default async function FornitoriMaterialiPage() {
  const [dati, stati] = await Promise.all([
    apiFetch<FornitoreMateriali[]>("/api/anagrafica/fornitori-materiali"),
    apiFetch<CatalogoVoce[]>("/api/anagrafica/cataloghi/stati-fornitori-materiali"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["fornitori-materiali"]}
        title="Fornitori di materiali"
        subtitle="Fornitori di materiali utilizzati dall'azienda."
        badge={<SectionStatusBadge compilata={dati.length > 0} />}
      />
      <FornitoriTable dati={dati} stati={stati} />
    </div>
  );
}
