import { Building2 } from "lucide-react";
import { notFound } from "next/navigation";

import { AbbonamentiPanel } from "@/components/abbonamenti-panel";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import type { Abbonamento, CertificazioneCatalogo, StatoCertificazioneCatalogo } from "@/lib/types/abbonamenti";
import type { AziendaAmministrazione } from "@/lib/types/superadmin";

import { aggiornaAbbonamento, disattivaAbbonamento } from "./actions";

export default async function AziendaDettaglioSuperadminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [aziende, abbonamenti, certificazioni, stati] = await Promise.all([
    apiFetch<AziendaAmministrazione[]>("/api/superadmin/aziende"),
    apiFetch<Abbonamento[]>(`/api/superadmin/aziende/${id}/abbonamenti`),
    apiFetch<CertificazioneCatalogo[]>("/api/sistema/certificazioni"),
    apiFetch<StatoCertificazioneCatalogo[]>("/api/sistema/stati-certificazione"),
  ]);

  const azienda = aziende.find((a) => a.id === id);
  if (!azienda) notFound();

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
