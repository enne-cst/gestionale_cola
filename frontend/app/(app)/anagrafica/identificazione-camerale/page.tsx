import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { campiFissati } from "@/lib/panoramica-helpers";
import type { IdentificazioneCamerale } from "@/lib/types/anagrafica";

import { IdentificazioneCameraleForm } from "./form";

export default async function IdentificazioneCameralePage() {
  const [dati, voci] = await Promise.all([
    apiFetch<IdentificazioneCamerale | null>("/api/anagrafica/identificazione-camerale"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["identificazione-camerale"]}
        title="Identificazione camerale"
        subtitle="Dati identificativi estratti dalla visura camerale."
      />
      <IdentificazioneCameraleForm dati={dati} campiInPanoramica={campiFissati(voci, "identificazione-camerale")} />
    </div>
  );
}
