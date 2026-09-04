import type { PersonaProfilo } from "@/lib/types/personale-hr";

/** Versione minima della Panoramica (§11): le quattro card con KPI
 * (stato monitorato, in scadenza, scaduto, attività pianificata) e la card
 * Ruoli assegnati richiedono gli endpoint aggregati delle Fasi 3-5
 * (competenze, formazione/abilitazioni, idoneità, ruoli, scadenziario),
 * non ancora costruiti — mostrarle con dati finti sarebbe peggio che non
 * mostrarle. Qui solo ciò che è già reale: il rapporto corrente. */
export function PanoramicaTab({ persona }: { persona: PersonaProfilo }) {
  const rapporto = persona.rapporto_corrente;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Gli indicatori di stato (registrazioni valide/in scadenza/scadute, attività pianificate, ruoli assegnati) arrivano
        con le fasi successive del modulo Personale (formazione, abilitazioni, idoneità, ruoli, scadenziario).
      </div>
      {rapporto ? (
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-3 font-semibold text-foreground">Rapporto corrente</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Tipo di rapporto</dt>
              <dd className="text-foreground">{rapporto.tipo_rapporto.denominazione}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data inizio</dt>
              <dd className="text-foreground">{new Date(rapporto.data_inizio).toLocaleDateString("it-IT")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mansione</dt>
              <dd className="text-foreground">{rapporto.mansione?.denominazione ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Reparto</dt>
              <dd className="text-foreground">{rapporto.reparto?.denominazione ?? "—"}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          Nessun rapporto registrato per questa persona.
        </div>
      )}
    </div>
  );
}
