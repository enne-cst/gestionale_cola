"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { getApiResource } from "@/lib/actions/api-resource";
import type {
  GiudizioIdoneitaValore,
  IdoneitaSanitaria,
  StatoGiudizioIdoneita,
  TipoVisita,
} from "@/lib/types/personale-hr";

import { aggiornaAppuntamentoVisita } from "../actions";
import { PianificaVisitaDialog } from "../pianifica-visita-dialog";
import { PromemoriaVisitaDialog } from "../promemoria-visita-dialog";
import { VisitaIdoneitaDialog } from "../visita-idoneita-dialog";

const GIUDIZIO_LABEL: Record<GiudizioIdoneitaValore, string> = {
  IDONEO: "Idoneo",
  IDONEO_CON_PRESCRIZIONI: "Idoneo con prescrizioni",
  IDONEO_TEMPORANEAMENTE: "Temporaneamente non idoneo",
  NON_IDONEO: "Non idoneo",
};

const STATO_LABEL: Record<StatoGiudizioIdoneita, string> = {
  VALIDA: "Valida",
  IN_SCADENZA: "In scadenza",
  SCADUTA: "Scaduta",
  SOSTITUITA: "Sostituita",
};

const STATO_VARIANT: Record<StatoGiudizioIdoneita, "success" | "warning" | "destructive" | "secondary"> = {
  VALIDA: "success",
  IN_SCADENZA: "warning",
  SCADUTA: "destructive",
  SOSTITUITA: "secondary",
};

const STORICO_VISIBILE_DEFAULT = 5;

function KpiCard({ label, valore, tono }: { label: string; valore: string; tono: "success" | "warning" | "destructive" | "default" }) {
  const coloreTesto =
    tono === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tono === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tono === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-lg font-semibold ${coloreTesto}`}>{valore}</span>
    </div>
  );
}

/** Tab "Idoneità sanitaria" (precisazione implementativa incrementale
 * omonima). Gli indicatori superiori sono sempre calcolati dal backend a
 * partire dai record reali (§17: mai colonne autonome), letti da un unico
 * endpoint aggregato — stesso principio già applicato in "Formazione e
 * abilitazioni". "Prossima visita" mostra solo un appuntamento pianificato
 * reale (per_attivita), mai la scadenza del giudizio: le due cose restano
 * concetti distinti in tutta la vista (§6). */
export function IdoneitaSanitariaTab({ personaId }: { personaId: string }) {
  const [dati, setDati] = useState<IdoneitaSanitaria | null>(null);
  const [tipiVisita, setTipiVisita] = useState<TipoVisita[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [mostraTutte, setMostraTutte] = useState(false);
  const [annullando, setAnnullando] = useState(false);

  function ricarica() {
    setErrore(null);
    Promise.all([
      getApiResource<IdoneitaSanitaria>(`/api/personale/persone/${personaId}/idoneita`),
      getApiResource<TipoVisita[]>("/api/personale/tipi-visita"),
    ])
      .then(([d, t]) => {
        setDati(d);
        setTipiVisita(t);
      })
      .catch(() => setErrore("Impossibile caricare l'idoneità sanitaria."));
  }

  useEffect(() => {
    setDati(null);
    setMostraTutte(false);
    ricarica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId]);

  if (errore) {
    return <p className="text-sm text-destructive">{errore}</p>;
  }

  if (dati === null) {
    return <p className="text-sm text-muted-foreground">Caricamento…</p>;
  }

  async function onAnnullaAppuntamento() {
    if (!dati?.prossimo_appuntamento) return;
    setAnnullando(true);
    await aggiornaAppuntamentoVisita(dati.prossimo_appuntamento.id, {
      data: dati.prossimo_appuntamento.data,
      ora: dati.prossimo_appuntamento.ora,
      medico_competente: dati.prossimo_appuntamento.medico_competente,
      luogo: dati.prossimo_appuntamento.luogo,
      note: dati.prossimo_appuntamento.note,
      stato: "ANNULLATA",
    });
    setAnnullando(false);
    ricarica();
  }

  const { indicatori, storico, prossimo_appuntamento: appuntamento, esposizioni } = dati;
  const righeStoriche = mostraTutte ? storico : storico.slice(0, STORICO_VISIBILE_DEFAULT);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Idoneità sanitaria</h3>
          <p className="text-sm text-muted-foreground">Giudizio sintetico, validità e visite programmate</p>
        </div>
        <VisitaIdoneitaDialog
          personaId={personaId}
          tipiVisita={tipiVisita}
          onSaved={ricarica}
          trigger={<Button size="sm">+ Registra visita</Button>}
        />
      </div>

      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <span>🔒</span>
        <span>
          <strong className="text-foreground">Dati sanitari protetti</strong> · visibili esclusivamente agli utenti
          autorizzati
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Ultimo giudizio"
          valore={indicatori.ultimo_giudizio ? GIUDIZIO_LABEL[indicatori.ultimo_giudizio] : "—"}
          tono={indicatori.ultimo_giudizio === "NON_IDONEO" ? "destructive" : indicatori.ultimo_giudizio ? "success" : "default"}
        />
        <KpiCard label="Valido fino al" valore={formatDate(indicatori.valido_fino_al)} tono="default" />
        <KpiCard label="Prossima visita" valore={appuntamento ? formatDate(appuntamento.data) : "Non pianificata"} tono="default" />
        <KpiCard label="Limitazioni segnalate" valore={indicatori.limitazioni_segnalate ? "Presenti" : "Nessuna"} tono={indicatori.limitazioni_segnalate ? "warning" : "success"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-border">
          <div className="flex items-center justify-between border-b border-border p-3">
            <h4 className="text-sm font-semibold text-foreground">Storico visite</h4>
            {storico.length > STORICO_VISIBILE_DEFAULT && (
              <button type="button" className="text-sm text-primary hover:underline" onClick={() => setMostraTutte((v) => !v)}>
                {mostraTutte ? "Mostra recenti" : "Mostra tutte"}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-3 font-medium">Tipo visita</th>
                  <th className="p-3 font-medium">Data</th>
                  <th className="p-3 font-medium">Giudizio</th>
                  <th className="p-3 font-medium">Scadenza</th>
                  <th className="p-3 font-medium">Documento</th>
                  <th className="p-3 font-medium">Stato</th>
                  <th className="p-3 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {righeStoriche.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      Nessun giudizio disponibile.
                    </td>
                  </tr>
                ) : (
                  righeStoriche.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0">
                      <td className="p-3">{v.tipo_visita.denominazione}</td>
                      <td className="p-3">{formatDate(v.data_visita)}</td>
                      <td className="p-3">{GIUDIZIO_LABEL[v.giudizio]}</td>
                      <td className="p-3">{formatDate(v.data_scadenza)}</td>
                      <td className="p-3">
                        {v.documento_presente ? (
                          <span className="text-primary">🔒 Presente</span>
                        ) : (
                          <span className="text-muted-foreground">🔒 Da integrare</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={STATO_VARIANT[v.stato]}>{STATO_LABEL[v.stato]}</Badge>
                      </td>
                      <td className="p-3">
                        <VisitaIdoneitaDialog
                          personaId={personaId}
                          tipiVisita={tipiVisita}
                          visita={v}
                          onSaved={ricarica}
                          trigger={
                            <Button variant="outline" size="sm">
                              Modifica
                            </Button>
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border p-3">
            <h4 className="text-sm font-semibold text-foreground">Prossima attività</h4>
            {appuntamento ? (
              <div className="mt-2 flex flex-col gap-2 text-sm">
                <div>
                  <strong className="text-foreground">{appuntamento.titolo}</strong>
                  <p className="text-muted-foreground">
                    {formatDate(appuntamento.data)}
                    {appuntamento.ora ? ` · ${appuntamento.ora.slice(0, 5)}` : ""}
                  </p>
                  {appuntamento.medico_competente && <p className="text-muted-foreground">{appuntamento.medico_competente}</p>}
                  {appuntamento.luogo && <p className="text-muted-foreground">{appuntamento.luogo}</p>}
                </div>
                <Badge variant="default" className="w-fit">
                  Pianificata
                </Badge>
                <div className="flex flex-wrap gap-2">
                  <PianificaVisitaDialog
                    personaId={personaId}
                    tipiVisita={tipiVisita}
                    appuntamento={appuntamento}
                    onSaved={ricarica}
                    trigger={
                      <Button variant="outline" size="sm">
                        Modifica
                      </Button>
                    }
                  />
                  <Button variant="outline" size="sm" onClick={onAnnullaAppuntamento} disabled={annullando}>
                    {annullando ? "Annullamento…" : "Annulla"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2 text-sm">
                <p className="font-medium text-foreground">Visita da pianificare</p>
                <p className="text-muted-foreground">
                  {indicatori.valido_fino_al ? `Entro il ${formatDate(indicatori.valido_fino_al)}` : "Nessuna data prevista"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <PianificaVisitaDialog
                    personaId={personaId}
                    tipiVisita={tipiVisita}
                    onSaved={ricarica}
                    trigger={<Button size="sm">Pianifica</Button>}
                  />
                  <PromemoriaVisitaDialog
                    personaId={personaId}
                    dataSuggerita={indicatori.valido_fino_al}
                    onSaved={ricarica}
                    trigger={
                      <Button variant="outline" size="sm">
                        Promemoria
                      </Button>
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Esposizioni associate</h4>
              <span className="text-xs text-muted-foreground">Sola lettura</span>
            </div>
            {esposizioni.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nessuna esposizione disponibile: il modulo Sicurezza non è ancora attivo per questa azienda.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1">
                {esposizioni.map((e) => (
                  <Badge key={e.denominazione} variant="outline">
                    {e.denominazione}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
