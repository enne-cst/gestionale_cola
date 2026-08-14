import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { campiFissati } from "@/lib/panoramica-helpers";
import type { CapitaleSociale } from "@/lib/types/anagrafica";

import { CapitaleSocialeForm } from "./form";

export default async function CapitaleSocialePage() {
  const [dati, voci] = await Promise.all([
    apiFetch<CapitaleSociale | null>("/api/anagrafica/capitale-sociale"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  const compilata = Boolean(dati?.capitale_deliberato || dati?.capitale_sottoscritto || dati?.capitale_versato);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["capitale-sociale"]}
        title="Capitale sociale"
        subtitle="Capitale deliberato, sottoscritto e versato."
        badge={<SectionStatusBadge compilata={compilata} />}
      />
      <CapitaleSocialeForm dati={dati} campiInPanoramica={campiFissati(voci, "capitale-sociale")} />
    </div>
  );
}
