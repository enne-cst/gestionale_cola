import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { CapitaleSociale } from "@/lib/types/anagrafica";

import { CapitaleSocialeForm } from "./form";

export default async function CapitaleSocialePage() {
  const dati = await apiFetch<CapitaleSociale | null>("/api/anagrafica/capitale-sociale");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["capitale-sociale"]}
        title="Capitale sociale"
        subtitle="Capitale deliberato, sottoscritto e versato."
      />
      <CapitaleSocialeForm dati={dati} />
    </div>
  );
}
