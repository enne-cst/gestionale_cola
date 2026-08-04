"use client";

import { Button } from "@/components/ui/button";

export function BloccaAziendaButton({
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
        if (!confirm(`Bloccare l'accesso per "${ragioneSociale}"?`)) event.preventDefault();
      }}
    >
      <Button type="submit" variant="outline" size="sm">
        Blocca accesso
      </Button>
    </form>
  );
}
