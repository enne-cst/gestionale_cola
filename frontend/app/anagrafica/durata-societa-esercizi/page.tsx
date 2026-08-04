import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { DurataSocietaEsercizi } from "@/lib/types/anagrafica";

import { DurataSocietaEserciziForm } from "./form";

export default async function DurataSocietaEserciziPage() {
  const dati = await apiFetch<DurataSocietaEsercizi | null>("/api/anagrafica/durata-societa-esercizi");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["durata-societa-esercizi"]}
        title="Durata società ed esercizi"
        subtitle="Termine della società e scadenze degli esercizi sociali."
      />
      <DurataSocietaEserciziForm dati={dati} />
    </div>
  );
}
