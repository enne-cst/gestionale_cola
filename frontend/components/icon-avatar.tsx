import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function IconAvatar({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
        size === "sm" && "size-8 rounded-lg",
        size === "md" && "size-11",
        size === "lg" && "size-14 rounded-2xl",
        className,
      )}
    >
      <Icon className={cn(size === "sm" && "size-4", size === "md" && "size-5", size === "lg" && "size-7")} />
    </span>
  );
}
