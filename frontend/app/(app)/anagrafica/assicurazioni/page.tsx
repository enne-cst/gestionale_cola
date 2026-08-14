import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { Assicurazione, CatalogoVoce } from "@/lib/types/anagrafica-iso9001";

import { AssicurazioniTable } from "./assicurazioni-table";

export default async function AssicurazioniPage() {
  const [dati, stati, frequenze] = await Promise.all([
    apiFetch<Assicurazione[]>("/api/anagrafica/assicurazioni"),
    apiFetch<CatalogoVoce[]>("/api/anagrafica/cataloghi/stati-assicurazioni"),
    apiFetch<CatalogoVoce[]>("/api/anagrafica/cataloghi/frequenze-rinnovo-assicurazioni"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE.assicurazioni}
        title="Polizze assicurative"
        subtitle="Tutte le polizze assicurative dell'azienda."
        badge={<SectionStatusBadge compilata={dati.length > 0} />}
      />
      <AssicurazioniTable dati={dati} stati={stati} frequenze={frequenze} />
    </div>
  );
}
