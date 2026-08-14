import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { VariazioneOrganico } from "@/lib/types/anagrafica-iso9001";

import { VariazioniTable } from "./variazioni-table";

export default async function VariazioniOrganicoPage() {
  const dati = await apiFetch<VariazioneOrganico[]>("/api/anagrafica/variazioni-organico");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["variazioni-organico"]}
        title="Variazioni organico"
        subtitle="Assunzioni, cessazioni e obiettivo di variazione dell'organico. Richiede prima una rilevazione in 'Dati generali del personale' per lo stesso anno."
        badge={<SectionStatusBadge compilata={dati.length > 0} />}
      />
      <VariazioniTable dati={dati} />
    </div>
  );
}
