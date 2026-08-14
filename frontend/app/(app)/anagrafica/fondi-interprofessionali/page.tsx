import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { SEZIONE_ICONE } from "@/lib/anagrafica-icons";
import type { CatalogoVoce, FondoInterprofessionale } from "@/lib/types/anagrafica-iso9001";

import { FondiTable } from "./fondi-table";

export default async function FondiInterprofessionaliPage() {
  const [fondi, statiIscrizione] = await Promise.all([
    apiFetch<FondoInterprofessionale[]>("/api/anagrafica/fondi-interprofessionali"),
    apiFetch<CatalogoVoce[]>("/api/anagrafica/cataloghi/stati-iscrizione-fondo"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SEZIONE_ICONE["fondi-interprofessionali"]}
        title="Fondi interprofessionali"
        subtitle="Storico delle iscrizioni ai fondi interprofessionali."
      />
      <FondiTable fondi={fondi} statiIscrizione={statiIscrizione} />
    </div>
  );
}
