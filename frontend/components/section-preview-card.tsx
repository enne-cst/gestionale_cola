import { PencilIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { IconAvatar } from "@/components/icon-avatar";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Card di anteprima per una sezione a singolo record (identificazione
 * camerale, capitale sociale...): mostra alcuni campi chiave, lo stato di
 * compilazione e un accesso rapido alla modifica. */
export function SectionPreviewCard({
  icon,
  title,
  compilata,
  href,
  children,
}: {
  icon: LucideIcon;
  title: string;
  compilata: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base">
          <IconAvatar icon={icon} size="sm" />
          {title}
        </CardTitle>
        <CardAction className="flex items-center gap-1">
          <SectionStatusBadge compilata={compilata} completeLabel="Completo" />
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={href} aria-label={`Modifica ${title}`}>
              <PencilIcon className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children}
        <Button asChild variant="outline" className="w-full">
          <Link href={href}>Visualizza dettagli</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
