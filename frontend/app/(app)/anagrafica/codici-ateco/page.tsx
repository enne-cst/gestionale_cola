import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { recordIdsFissati } from "@/lib/panoramica-helpers";
import type { CodiceAteco, Sede } from "@/lib/types/anagrafica";

import { CodiciAtecoTable } from "./codici-ateco-table";

export default async function CodiciAtecoPage() {
  const [codici, sedi, voci] = await Promise.all([
    apiFetch<CodiceAteco[]>("/api/anagrafica/codici-ateco"),
    apiFetch<Sede[]>("/api/anagrafica/sedi"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["codici-ateco"]}
        title="Codici ATECO"
        subtitle="Codice attività prevalente ed eventuali codici secondari."
        badge={<SectionStatusBadge compilata={codici.length > 0} />}
      />
      <CodiciAtecoTable codici={codici} sedi={sedi} recordIdsInPanoramica={recordIdsFissati(voci, "codici-ateco")} />
    </div>
  );
}
