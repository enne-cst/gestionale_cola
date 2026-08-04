import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { AziendaAmministrazione, ConsulenteAmministrazione } from "@/lib/types/superadmin";

import { AssociaConsulenteForm } from "./associa-consulente-form";
import { AziendeApprovate } from "./aziende-approvate";
import { AziendeInAttesa } from "./aziende-in-attesa";

export default async function SuperadminPage() {
  const [aziende, consulenti] = await Promise.all([
    apiFetch<AziendaAmministrazione[]>("/api/superadmin/aziende"),
    apiFetch<ConsulenteAmministrazione[]>("/api/superadmin/consulenti"),
  ]);

  const inAttesa = aziende.filter((azienda) => azienda.stato_approvazione === "in_attesa");
  const approvate = aziende.filter((azienda) => azienda.stato_approvazione === "approvata");

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        icon={ShieldCheck}
        title="Area super admin"
        subtitle="Approva le aziende create dai consulenti e gestisci consulenti e associazioni"
        size="lg"
      />

      <Link href="/superadmin/consulenti" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
        Gestisci consulenti
      </Link>

      <AziendeInAttesa aziende={inAttesa} />
      <AziendeApprovate aziende={approvate} />
      <AssociaConsulenteForm aziende={aziende} consulenti={consulenti} />
    </div>
  );
}
