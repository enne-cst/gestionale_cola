import { Building2 } from "lucide-react";

import { AbbonamentiPanel } from "@/components/abbonamenti-panel";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import type { Abbonamento, CertificazioneCatalogo, StatoCertificazioneCatalogo } from "@/lib/types/abbonamenti";
import type { AziendaCliente } from "@/lib/types/consulente";

import { aggiornaAbbonamento, disattivaAbbonamento } from "./actions";

export default async function AziendaDettaglioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [azienda, abbonamenti, certificazioni, stati] = await Promise.all([
    apiFetch<AziendaCliente>(`/api/consulente/aziende/${id}`),
    apiFetch<Abbonamento[]>(`/api/consulente/aziende/${id}/abbonamenti`),
    apiFetch<CertificazioneCatalogo[]>("/api/sistema/certificazioni"),
    apiFetch<StatoCertificazioneCatalogo[]>("/api/sistema/stati-certificazione"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={Building2}
        title={azienda.ragione_sociale}
        subtitle="Abbonamenti attivi per questa azienda: attivano automaticamente le sezioni dei moduli soggette a ciascuna certificazione."
        size="lg"
      />
      <AbbonamentiPanel
        aziendaId={id}
        abbonamenti={abbonamenti}
        certificazioni={certificazioni}
        stati={stati}
        upsertAction={aggiornaAbbonamento}
        disattivaAction={disattivaAbbonamento}
      />
    </div>
  );
}
