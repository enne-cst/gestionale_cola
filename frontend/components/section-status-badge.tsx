import { CheckCircle2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/** Badge di stato "Completa/Da compilare" mostrato in testata di ogni
 * pagina di sezione, coerente con quello usato nelle card di anteprima
 * della panoramica (vedi section-preview-card.tsx e
 * section-list-preview-card.tsx). */
export function SectionStatusBadge({
  compilata,
  completeLabel = "Completa",
  incompleteLabel = "Da compilare",
}: {
  compilata: boolean;
  completeLabel?: string;
  incompleteLabel?: string;
}) {
  return (
    <Badge variant={compilata ? "success" : "warning"} className="gap-1">
      {compilata && <CheckCircle2Icon className="size-3" />}
      {compilata ? completeLabel : incompleteLabel}
    </Badge>
  );
}
