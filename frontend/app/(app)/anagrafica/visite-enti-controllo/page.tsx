import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { VisitaEnteControllo } from "@/lib/types/anagrafica-iso9001";

import { VisiteTable } from "./visite-table";

export default async function VisiteEntiControlloPage() {
  const dati = await apiFetch<VisitaEnteControllo[]>("/api/anagrafica/visite-enti-controllo");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["visite-enti-controllo"]}
        title="Visite enti di controllo"
        subtitle="Visite e verifiche effettuate dagli enti di controllo presso l'azienda."
      />
      <VisiteTable dati={dati} />
    </div>
  );
}
