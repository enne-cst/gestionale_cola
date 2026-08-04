import { Button } from "@/components/ui/button";
import type { ConsulenteAmministrazione } from "@/lib/types/superadmin";

import { attivaConsulente, disattivaConsulente, rimuoviAssociazione } from "./actions";

export function ConsulentiTable({ consulenti }: { consulenti: ConsulenteAmministrazione[] }) {
  if (consulenti.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessun consulente registrato.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {consulenti.map((consulente) => (
        <section key={consulente.id} className="flex flex-col gap-3 rounded-md border border-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">
                {consulente.cognome} {consulente.nome}
                {!consulente.attivo && <span className="ml-2 text-xs text-destructive">(disattivato)</span>}
              </p>
              <p className="text-sm text-muted-foreground">{consulente.email}</p>
            </div>
            <form action={(consulente.attivo ? disattivaConsulente : attivaConsulente).bind(null, consulente.id)}>
              <Button type="submit" variant="outline" size="sm">
                {consulente.attivo ? "Disattiva" : "Riattiva"}
              </Button>
            </form>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Aziende gestite</p>
            {consulente.aziende.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna azienda associata.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {consulente.aziende.map((azienda) => (
                  <li key={azienda.id} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-foreground">
                      {azienda.ragione_sociale}{" "}
                      <span className="text-muted-foreground">({azienda.stato_approvazione})</span>
                    </span>
                    <form action={rimuoviAssociazione.bind(null, azienda.id, consulente.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Rimuovi
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
