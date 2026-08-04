import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { AttivitaEsercitata } from "@/lib/types/anagrafica";

import { AttivitaEsercitataForm } from "./form";

export default async function AttivitaEsercitataPage() {
  const dati = await apiFetch<AttivitaEsercitata | null>("/api/anagrafica/attivita-esercitata");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["attivita-esercitata"]}
        title="Attività esercitata"
        subtitle="Descrizione dell'attività svolta dall'azienda."
      />
      <AttivitaEsercitataForm dati={dati} />
    </div>
  );
}
