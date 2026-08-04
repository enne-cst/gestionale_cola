import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { recordIdsFissati } from "@/lib/panoramica-helpers";
import type { Sede } from "@/lib/types/anagrafica";

import { SediTable } from "./sedi-table";

export default async function SediPage() {
  const [sedi, voci] = await Promise.all([
    apiFetch<Sede[]>("/api/anagrafica/sedi"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE.sedi}
        title="Sedi"
        subtitle="Sede legale, operativa e altre unità locali dell'azienda."
      />
      <SediTable sedi={sedi} recordIdsInPanoramica={recordIdsFissati(voci, "sedi")} />
    </div>
  );
}
