import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { RipartizioneOrganico } from "@/lib/types/anagrafica-iso9001";

import { RipartizioneOrganicoTable } from "./ripartizione-organico-table";

export default async function RipartizioneOrganicoPage() {
  const dati = await apiFetch<RipartizioneOrganico[]>("/api/anagrafica/ripartizione-organico");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["ripartizione-organico"]}
        title="Ripartizione organico"
        subtitle="Composizione dell'organico per ruolo, genere, nazionalità, contratto e titolo di studio. Le percentuali sono calcolate rispetto ai dati generali dello stesso anno."
      />
      <RipartizioneOrganicoTable dati={dati} />
    </div>
  );
}
