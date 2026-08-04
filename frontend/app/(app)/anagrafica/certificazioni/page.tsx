import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { recordIdsFissati } from "@/lib/panoramica-helpers";
import type { Certificazione } from "@/lib/types/anagrafica";

import { CertificazioniTable } from "./certificazioni-table";

export default async function CertificazioniPage() {
  const [certificazioni, voci] = await Promise.all([
    apiFetch<Certificazione[]>("/api/anagrafica/certificazioni"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE.certificazioni}
        title="Certificazioni possedute"
        subtitle="Certificazioni dell'azienda, con i relativi settori IAF di accreditamento."
      />
      <CertificazioniTable
        certificazioni={certificazioni}
        recordIdsInPanoramica={recordIdsFissati(voci, "certificazioni")}
      />
    </div>
  );
}
