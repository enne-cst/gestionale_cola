import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { campiFissati } from "@/lib/panoramica-helpers";
import type { DurataSocietaEsercizi } from "@/lib/types/anagrafica";

import { DurataSocietaEserciziForm } from "./form";

export default async function DurataSocietaEserciziPage() {
  const [dati, voci] = await Promise.all([
    apiFetch<DurataSocietaEsercizi | null>("/api/anagrafica/durata-societa-esercizi"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["durata-societa-esercizi"]}
        title="Durata società ed esercizi"
        subtitle="Termine della società e scadenze degli esercizi sociali."
      />
      <DurataSocietaEserciziForm dati={dati} campiInPanoramica={campiFissati(voci, "durata-societa-esercizi")} />
    </div>
  );
}
