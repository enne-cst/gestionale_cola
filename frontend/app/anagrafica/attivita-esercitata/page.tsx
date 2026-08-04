import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { campiFissati } from "@/lib/panoramica-helpers";
import type { AttivitaEsercitata } from "@/lib/types/anagrafica";

import { AttivitaEsercitataForm } from "./form";

export default async function AttivitaEsercitataPage() {
  const [dati, voci] = await Promise.all([
    apiFetch<AttivitaEsercitata | null>("/api/anagrafica/attivita-esercitata"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["attivita-esercitata"]}
        title="Attività esercitata"
        subtitle="Descrizione dell'attività svolta dall'azienda."
      />
      <AttivitaEsercitataForm dati={dati} campiInPanoramica={campiFissati(voci, "attivita-esercitata")} />
    </div>
  );
}
