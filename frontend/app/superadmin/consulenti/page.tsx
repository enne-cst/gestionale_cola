import { Users } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { ConsulenteAmministrazione } from "@/lib/types/superadmin";

import { ConsulentiTable } from "./consulenti-table";

export default async function ConsulentiPage() {
  const consulenti = await apiFetch<ConsulenteAmministrazione[]>("/api/superadmin/consulenti");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={Users}
        title="Consulenti"
        subtitle="Crea account consulente e gestisci le aziende a loro associate"
        size="lg"
      />
      <Link href="/superadmin/consulenti/nuovo" className={buttonVariants({ className: "w-fit" })}>
        Nuovo consulente
      </Link>
      <ConsulentiTable consulenti={consulenti} />
    </div>
  );
}
