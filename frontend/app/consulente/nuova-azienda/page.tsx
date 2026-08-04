import { Building2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { NuovaAziendaForm } from "./form";

export default function NuovaAziendaPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={Building2}
        title="Nuova azienda"
        subtitle="Crea l'azienda cliente e il suo account di accesso"
        size="lg"
      />
      <NuovaAziendaForm />
    </div>
  );
}
