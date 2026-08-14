import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { CatalogoVoce, LavoratoreAutonomo } from "@/lib/types/anagrafica-iso9001";

import { LavoratoriTable } from "./lavoratori-table";

export default async function LavoratoriAutonomiPage() {
  const [dati, stati] = await Promise.all([
    apiFetch<LavoratoreAutonomo[]>("/api/anagrafica/lavoratori-autonomi"),
    apiFetch<CatalogoVoce[]>("/api/anagrafica/cataloghi/stati-lavoratori-autonomi"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["lavoratori-autonomi"]}
        title="Lavoratori autonomi"
        subtitle="Lavoratori autonomi e professionisti esterni che collaborano con l'azienda."
        badge={<SectionStatusBadge compilata={dati.length > 0} />}
      />
      <LavoratoriTable dati={dati} stati={stati} />
    </div>
  );
}
