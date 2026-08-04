import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { Contatto } from "@/lib/types/anagrafica";

import { ContattiTable } from "./contatti-table";

export default async function ContattiPage() {
  const contatti = await apiFetch<Contatto[]>("/api/anagrafica/contatti");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE.contatti}
        title="Contatti e recapiti"
        subtitle="Telefono, email, PEC e altri recapiti dell'azienda."
      />
      <ContattiTable contatti={contatti} />
    </div>
  );
}
