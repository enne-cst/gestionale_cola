import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { recordIdsFissati } from "@/lib/panoramica-helpers";
import type { AlboRuoloLicenza, Sede } from "@/lib/types/anagrafica";

import { AlbiTable } from "./albi-table";

export default async function AlbiRuoliLicenzePage() {
  const [albi, sedi, voci] = await Promise.all([
    apiFetch<AlboRuoloLicenza[]>("/api/anagrafica/albi-ruoli-licenze"),
    apiFetch<Sede[]>("/api/anagrafica/sedi"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["albi-ruoli-licenze"]}
        title="Albi, ruoli e licenze"
        subtitle="Iscrizioni ad albi, registri, ruoli, licenze e autorizzazioni dell'azienda."
        badge={<SectionStatusBadge compilata={albi.length > 0} />}
      />
      <AlbiTable albi={albi} sedi={sedi} recordIdsInPanoramica={recordIdsFissati(voci, "albi-ruoli-licenze")} />
    </div>
  );
}
