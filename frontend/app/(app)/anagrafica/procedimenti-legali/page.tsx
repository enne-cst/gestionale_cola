import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { CatalogoVoce, ProcedimentoLegale } from "@/lib/types/anagrafica-iso9001";

import { ProcedimentiTable } from "./procedimenti-table";

export default async function ProcedimentiLegaliPage() {
  const [dati, stati] = await Promise.all([
    apiFetch<ProcedimentoLegale[]>("/api/anagrafica/procedimenti-legali"),
    apiFetch<CatalogoVoce[]>("/api/anagrafica/cataloghi/stati-procedimenti-legali"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["procedimenti-legali"]}
        title="Procedimenti legali"
        subtitle="Procedimenti legali che coinvolgono l'azienda."
      />
      <ProcedimentiTable dati={dati} stati={stati} />
    </div>
  );
}
