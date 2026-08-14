import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { IconAvatar } from "@/components/icon-avatar";

export function PageHeader({
  icon,
  title,
  subtitle,
  size = "md",
  badge,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  size?: "md" | "lg";
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <IconAvatar icon={icon} size={size === "lg" ? "lg" : "md"} />
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className={size === "lg" ? "text-2xl font-semibold text-foreground" : "text-xl font-semibold text-foreground"}>
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
