"use client";

import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  confirmMessage = "Eliminare questo elemento?",
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
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
