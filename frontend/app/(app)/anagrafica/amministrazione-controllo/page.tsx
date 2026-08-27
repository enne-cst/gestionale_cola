import { PageHeader } from "@/components/page-header";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import { campiFissati } from "@/lib/panoramica-helpers";
import type { AmministrazioneControllo } from "@/lib/types/anagrafica";

import { AmministrazioneControlloForm } from "./form";

export default async function AmministrazioneControlloPage() {
  const [dati, voci] = await Promise.all([
    apiFetch<AmministrazioneControllo | null>("/api/anagrafica/amministrazione-controllo"),
    getVociPanoramica(MODULO_ANAGRAFICA),
  ]);

  const compilata = Boolean(
    dati?.durata_in_carica_organo ||
      dati?.numero_minimo_amministratori ||
      dati?.numero_amministratori_in_carica ||
      dati?.numero_sindaci_organi_controllo ||
      dati?.numero_titolari_cariche,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["amministrazione-controllo"]}
        title="Amministrazione e controllo"
        subtitle="Sistema di amministrazione e controllo adottato dalla società."
        badge={<SectionStatusBadge compilata={compilata} />}
      />
      <AmministrazioneControlloForm
        dati={dati}
        campiInPanoramica={campiFissati(voci, "amministrazione-controllo")}
      />
    </div>
  );
}
