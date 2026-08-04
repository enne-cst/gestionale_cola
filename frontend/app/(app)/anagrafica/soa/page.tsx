import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { recordIdsFissati } from "@/lib/panoramica-helpers";
import type { Soa } from "@/lib/types/anagrafica";

import { SoaTable } from "./soa-table";

export default async function SoaPage() {
  const [attestazioni, voci] = await Promise.all([
    apiFetch<Soa[]>("/api/anagrafica/soa"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE.soa}
        title="Attestazioni SOA"
        subtitle="Attestazioni SOA possedute, con le relative categorie e classifiche."
      />
      <SoaTable attestazioni={attestazioni} recordIdsInPanoramica={recordIdsFissati(voci, "soa")} />
    </div>
  );
}
