import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { TurniLavoro } from "@/lib/types/anagrafica-iso9001";

import { TurniLavoroForm } from "./form";

export default async function TurniLavoroPage() {
  const dati = await apiFetch<TurniLavoro | null>("/api/anagrafica/turni-lavoro");
  const compilata = Boolean(dati?.tipologia_turno);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["turni-lavoro"]}
        title="Turni di lavoro"
        subtitle="Organizzazione corrente dei turni di lavoro dell'azienda."
        badge={<SectionStatusBadge compilata={compilata} />}
      />
      <TurniLavoroForm dati={dati} />
    </div>
  );
}
