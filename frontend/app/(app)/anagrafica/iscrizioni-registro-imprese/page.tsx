import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { recordIdsFissati } from "@/lib/panoramica-helpers";
import type { IscrizioneRegistroImprese } from "@/lib/types/anagrafica";

import { IscrizioniTable } from "./iscrizioni-table";

export default async function IscrizioniRegistroImpresePage() {
  const [iscrizioni, voci] = await Promise.all([
    apiFetch<IscrizioneRegistroImprese[]>("/api/anagrafica/iscrizioni-registro-imprese"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["iscrizioni-registro-imprese"]}
        title="Iscrizioni registro imprese"
        subtitle="Sezioni del Registro delle Imprese presso cui l'azienda risulta iscritta."
        badge={<SectionStatusBadge compilata={iscrizioni.length > 0} />}
      />
      <IscrizioniTable
        iscrizioni={iscrizioni}
        recordIdsInPanoramica={recordIdsFissati(voci, "iscrizioni-registro-imprese")}
      />
    </div>
  );
}
