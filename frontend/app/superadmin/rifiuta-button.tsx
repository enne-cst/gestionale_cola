"use client";

import { Button } from "@/components/ui/button";

export function RifiutaButton({
  action,
  ragioneSociale,
}: {
  action: (formData: FormData) => void | Promise<void>;
  ragioneSociale: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(`Rifiutare l'azienda "${ragioneSociale}"?`)) event.preventDefault();
      }}
    >
      <Button type="submit" variant="outline" size="sm">
        Rifiuta
      </Button>
    </form>
  );
}
