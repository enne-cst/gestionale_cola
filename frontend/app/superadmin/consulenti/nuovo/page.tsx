import { Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";

import { NuovoConsulenteForm } from "./form";

export default function NuovoConsulentePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={Users}
        title="Nuovo consulente"
        subtitle="Crea l'account di accesso per un nuovo consulente"
        size="lg"
      />
      <NuovoConsulenteForm />
    </div>
  );
}
