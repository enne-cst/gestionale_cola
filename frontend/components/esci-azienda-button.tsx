import { Button } from "@/components/ui/button";
import { esciDaAzienda } from "@/lib/actions/azienda-attiva";

export function EsciAziendaButton() {
  return (
    <form action={esciDaAzienda}>
      <Button type="submit" variant="outline" size="sm">
        Esci dall&apos;azienda
      </Button>
    </form>
  );
}
