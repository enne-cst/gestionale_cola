import { ChevronRightIcon, PlusIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { IconAvatar } from "@/components/icon-avatar";
import { SectionStatusBadge } from "@/components/section-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Card di anteprima per una sezione a più record (sedi, contatti...):
 * mostra i primi elementi con un accesso rapido all'elenco completo. */
export function SectionListPreviewCard<T extends { id: string }>({
  icon,
  title,
  href,
  items,
  renderItem,
  emptyLabel,
}: {
  icon: LucideIcon;
  title: string;
  href: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  emptyLabel: string;
}) {
  const compilata = items.length > 0;

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
            <Link href={href} aria-label={`Aggiungi a ${title}`}>
              <PlusIcon className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.slice(0, 3).map((item) => (
              <li key={item.id}>
                <Link href={href} className="flex items-center gap-3 py-2 text-sm hover:text-primary">
                  {renderItem(item)}
                  <ChevronRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="outline" className="w-full">
          <Link href={href}>Visualizza tutte</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
