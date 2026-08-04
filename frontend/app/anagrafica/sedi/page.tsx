import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { Sede } from "@/lib/types/anagrafica";

import { SediTable } from "./sedi-table";

export default async function SediPage() {
  const sedi = await apiFetch<Sede[]>("/api/anagrafica/sedi");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE.sedi}
        title="Sedi"
        subtitle="Sede legale, operativa e altre unità locali dell'azienda."
      />
      <SediTable sedi={sedi} />
    </div>
  );
}
