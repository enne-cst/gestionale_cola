import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { DatiGenerali } from "@/lib/types/anagrafica-iso9001";

import { DatiGeneraliTable } from "./dati-generali-table";

export default async function DatiGeneraliPage() {
  const dati = await apiFetch<DatiGenerali[]>("/api/anagrafica/dati-generali");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["dati-generali"]}
        title="Dati generali del personale"
        subtitle="Fotografia annuale dell'organico aziendale al 31 dicembre."
      />
      <DatiGeneraliTable dati={dati} />
    </div>
  );
}
