import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { recordIdsFissati } from "@/lib/panoramica-helpers";
import type { AddettiComune } from "@/lib/types/anagrafica";

import { AddettiComuneTable } from "./addetti-comune-table";

export default async function AddettiComunePage() {
  const [distribuzioni, voci] = await Promise.all([
    apiFetch<AddettiComune[]>("/api/anagrafica/addetti-comune"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["addetti-comune"]}
        title="Addetti per comune"
        subtitle="Distribuzione degli addetti per comune, sede o unità locale."
        badge={<SectionStatusBadge compilata={distribuzioni.length > 0} />}
      />
      <AddettiComuneTable
        distribuzioni={distribuzioni}
        recordIdsInPanoramica={recordIdsFissati(voci, "addetti-comune")}
      />
    </div>
  );
}
