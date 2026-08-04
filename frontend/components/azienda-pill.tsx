import { Building2 } from "lucide-react";

export function AziendaPill({ ragioneSociale }: { ragioneSociale: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
      <Building2 className="size-4 text-primary" />
      {ragioneSociale}
    </div>
  );
}
