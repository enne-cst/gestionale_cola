import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { IdentificazioneCamerale } from "@/lib/types/anagrafica";

import { IdentificazioneCameraleForm } from "./form";

export default async function IdentificazioneCameralePage() {
  const dati = await apiFetch<IdentificazioneCamerale | null>("/api/anagrafica/identificazione-camerale");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["identificazione-camerale"]}
        title="Identificazione camerale"
        subtitle="Dati identificativi estratti dalla visura camerale."
      />
      <IdentificazioneCameraleForm dati={dati} />
    </div>
  );
}
