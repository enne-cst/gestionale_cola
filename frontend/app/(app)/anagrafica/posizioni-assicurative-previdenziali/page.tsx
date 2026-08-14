import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { PosizioniAssicurativePrevidenziali } from "@/lib/types/anagrafica-iso9001";

import { PosizioniAssicurativePrevidenzialiForm } from "./form";

export default async function PosizioniAssicurativePrevidenzialiPage() {
  const dati = await apiFetch<PosizioniAssicurativePrevidenziali | null>(
    "/api/anagrafica/posizioni-assicurative-previdenziali",
  );
  const compilata = Boolean(dati?.numero_posizione_inps);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["posizioni-assicurative-previdenziali"]}
        title="Posizioni assicurative e previdenziali"
        subtitle="Posizione INPS e posizione INAIL dell'azienda."
        badge={<SectionStatusBadge compilata={compilata} />}
      />
      <PosizioniAssicurativePrevidenzialiForm dati={dati} />
    </div>
  );
}
