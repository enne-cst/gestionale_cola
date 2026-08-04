import { Building2 } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";

export default function ConsulentePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Building2}
        title="Area consulente"
        subtitle="Crea e gestisci gli account delle aziende clienti"
        size="lg"
      />
      <Link href="/consulente/nuova-azienda" className={buttonVariants({ className: "w-fit" })}>
        Crea nuova azienda
      </Link>
    </div>
  );
}
