"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { sezioneBySlug } from "@/lib/anagrafica-sezioni";

export function AnagraficaBreadcrumb() {
  const pathname = usePathname();
  const slug = pathname.split("/")[2];
  const sezione = slug ? sezioneBySlug(slug) : undefined;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href="/anagrafica"
        className={cn("text-muted-foreground hover:text-foreground", !sezione && "font-medium text-foreground")}
      >
        Anagrafica Aziendale
      </Link>
      {sezione && (
        <>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{sezione.titolo}</span>
        </>
      )}
    </div>
  );
}
