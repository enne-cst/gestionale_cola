import { ArrowRightIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { IconAvatar } from "@/components/icon-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Card di anteprima leggera, senza stato di compilazione: usata per le
 * sezioni soggette ad abbonamento nella panoramica, per non dover caricare
 * i dati di ogni sezione (alcune abilitate, altre no) solo per mostrarne
 * un'anteprima. Solo icona, titolo, sottotitolo e link alla sezione. */
export function SectionLinkCard({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base">
          <IconAvatar icon={icon} size="sm" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Link href={href} className="flex items-center justify-between gap-2 text-sm text-muted-foreground hover:text-foreground">
          {subtitle}
          <ArrowRightIcon className="size-4 shrink-0" />
        </Link>
      </CardContent>
    </Card>
  );
}
