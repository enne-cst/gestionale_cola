import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { recordIdsFissati } from "@/lib/panoramica-helpers";
import type { AddettiVisura } from "@/lib/types/anagrafica";

import { AddettiVisuraTable } from "./addetti-visura-table";

export default async function AddettiVisuraPage() {
  const [rilevazioni, voci] = await Promise.all([
    apiFetch<AddettiVisura[]>("/api/anagrafica/addetti-visura"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["addetti-visura"]}
        title="Addetti da visura"
        subtitle="Rilevazioni periodiche del numero di addetti risultanti dalla visura camerale."
      />
      <AddettiVisuraTable
        rilevazioni={rilevazioni}
        recordIdsInPanoramica={recordIdsFissati(voci, "addetti-visura")}
      />
    </div>
  );
}
