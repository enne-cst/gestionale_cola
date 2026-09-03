"use client";

import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  confirmMessage = "Eliminare questo elemento?",
  onDeleted,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage?: string;
  // § pannelli del drawer caricati lato client (§ "falle tutte"): quei
  // pannelli non passano dalla revalidazione automatica di Next.js (la loro
  // pagina non è mai stata quella su cui gira `revalidatePath`), quindi
  // devono poter rieseguire da sé la fetch dopo un'eliminazione riuscita.
  // Facoltativo: nessun effetto per i chiamanti esistenti che non lo passano.
  onDeleted?: () => void;
}) {
  async function handleAction(formData: FormData) {
    await action(formData);
    onDeleted?.();
  }

  return (
    <form
      action={onDeleted ? handleAction : action}
      onSubmit={(event) => {
        if (!confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <Button type="submit" variant="ghost" size="icon" aria-label="Elimina">
        <Trash2Icon className="size-4" />
      </Button>
    </form>
  );
}
