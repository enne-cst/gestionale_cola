"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getApiResource } from "@/lib/actions/api-resource";
import type {
  CatalogoAbilitazione,
  CatalogoCorso,
  RegistrazioneFormativa,
  StatoRegistrazioneFormativa,
} from "@/lib/types/personale-hr";

import { RegistrazioneFormativaDialog } from "../registrazione-formativa-dialog";

const STATO_LABEL: Record<StatoRegistrazioneFormativa, string> = {
  VALIDA: "Valida",
  IN_SCADENZA: "In scadenza",
  SCADUTA: "Scaduta",
};

const STATO_VARIANT: Record<StatoRegistrazioneFormativa, "success" | "warning" | "destructive"> = {
  VALIDA: "success",
  IN_SCADENZA: "warning",
  SCADUTA: "destructive",
};

function formattaData(valore: string): string {
  const data = new Date(valore);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("it-IT");
}

function KpiCard({ label, valore, tono }: { label: string; valore: number; tono: "success" | "warning" | "destructive" | "default" }) {
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
      <span className={`text-2xl font-semibold ${coloreTesto}`}>{valore}</span>
    </div>
  );
}

/** Tab "Formazione e abilitazioni" (correzione "Struttura di 'Formazione e
 * abilitazioni'"): Formazione e Abilitazione condividono la stessa tabella
 * e lo stesso form, distinte solo dalla colonna compatta F/A (§3-§4) — mai
 * due tabelle, due schede o due pulsanti. Gli indicatori in alto sono
 * sempre calcolati dalla lista reale delle registrazioni, mai un numero
 * salvato a parte (§2). */
export function FormazioneAbilitazioniTab({ personaId }: { personaId: string }) {
  const [registrazioni, setRegistrazioni] = useState<RegistrazioneFormativa[] | null>(null);
  const [corsi, setCorsi] = useState<CatalogoCorso[]>([]);
  const [abilitazioni, setAbilitazioni] = useState<CatalogoAbilitazione[]>([]);
  const [errore, setErrore] = useState<string | null>(null);

  const [ricerca, setRicerca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"TUTTE" | "FORMAZIONE" | "ABILITAZIONE">("TUTTE");
  const [filtroStato, setFiltroStato] = useState<"TUTTI" | StatoRegistrazioneFormativa>("TUTTI");
  const [soloObbligatori, setSoloObbligatori] = useState(false);

  function ricarica() {
    setErrore(null);
    Promise.all([
      getApiResource<RegistrazioneFormativa[]>(`/api/personale/persone/${personaId}/formazione-abilitazioni`),
      getApiResource<CatalogoCorso[]>("/api/personale/corsi-formazione"),
      getApiResource<CatalogoAbilitazione[]>("/api/personale/abilitazioni-catalogo"),
    ])
      .then(([r, c, a]) => {
        setRegistrazioni(r);
        setCorsi(c);
        setAbilitazioni(a);
      })
      .catch(() => setErrore("Impossibile caricare la formazione e le abilitazioni."));
  }

  useEffect(() => {
    setRegistrazioni(null);
    ricarica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId]);

  if (errore) {
    return <p className="text-sm text-destructive">{errore}</p>;
  }

  if (registrazioni === null) {
    return <p className="text-sm text-muted-foreground">Caricamento…</p>;
  }

  const indicatori = {
    valide: registrazioni.filter((r) => r.stato === "VALIDA").length,
    inScadenza: registrazioni.filter((r) => r.stato === "IN_SCADENZA").length,
    scadute: registrazioni.filter((r) => r.stato === "SCADUTA").length,
    documentiPresenti: registrazioni.filter((r) => r.documento_presente).length,
  };

  const righeFiltrate = registrazioni.filter((r) => {
    if (ricerca && !r.denominazione.toLowerCase().includes(ricerca.toLowerCase())) return false;
    if (filtroTipo !== "TUTTE" && r.tipo !== filtroTipo) return false;
    if (filtroStato !== "TUTTI" && r.stato !== filtroStato) return false;
    if (soloObbligatori && !r.obbligatorio) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Formazione e abilitazioni</h3>
          <p className="text-sm text-muted-foreground">Corsi, attestati e abilitazioni possedute, con validità e documentazione</p>
        </div>
        <RegistrazioneFormativaDialog
          personaId={personaId}
          corsi={corsi}
          abilitazioni={abilitazioni}
          onSaved={ricarica}
          trigger={<Button size="sm">+ Aggiungi attestato</Button>}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Registrazioni valide" valore={indicatori.valide} tono="success" />
        <KpiCard label="In scadenza" valore={indicatori.inScadenza} tono="warning" />
        <KpiCard label="Scaduta" valore={indicatori.scadute} tono="destructive" />
        <KpiCard label="Documenti presenti" valore={indicatori.documentiPresenti} tono="default" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca corso, attestato o abilitazione..."
          className="h-9 max-w-xs text-sm"
        />
        <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as typeof filtroTipo)}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TUTTE">Tutte le tipologie</SelectItem>
            <SelectItem value="FORMAZIONE">Formazione</SelectItem>
            <SelectItem value="ABILITAZIONE">Abilitazione</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroStato} onValueChange={(v) => setFiltroStato(v as typeof filtroStato)}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TUTTI">Tutti gli stati</SelectItem>
            <SelectItem value="VALIDA">Valida</SelectItem>
            <SelectItem value="IN_SCADENZA">In scadenza</SelectItem>
            <SelectItem value="SCADUTA">Scaduta</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={soloObbligatori} onCheckedChange={setSoloObbligatori} />
          Solo obbligatori
        </label>
      </div>

      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-3">
          <h4 className="text-sm font-semibold text-foreground">Registrazioni acquisite</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium" title="F = Formazione, A = Abilitazione">
                  F/A
                </th>
                <th className="p-3 font-medium">Corso/abilitazione</th>
                <th className="p-3 font-medium">Conseguimento</th>
                <th className="p-3 font-medium">Scadenza</th>
                <th className="p-3 font-medium">Durata</th>
                <th className="p-3 font-medium">Documento</th>
                <th className="p-3 font-medium">Stato</th>
                <th className="p-3 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {righeFiltrate.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Nessuna registrazione trovata.
                  </td>
                </tr>
              ) : (
                righeFiltrate.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <span
                        aria-label={r.tipo === "FORMAZIONE" ? "Formazione" : "Abilitazione"}
                        title={r.tipo === "FORMAZIONE" ? "Formazione" : "Abilitazione"}
                        className="font-semibold text-foreground"
                      >
                        {r.tipo === "FORMAZIONE" ? "F" : "A"}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{r.denominazione}</td>
                    <td className="p-3">{formattaData(r.data_conseguimento)}</td>
                    <td className="p-3">{formattaData(r.data_scadenza)}</td>
                    <td className="p-3">{Number(r.durata_ore)} ore</td>
                    <td className="p-3">
                      {r.documento_presente ? (
                        <span className="text-primary">Presente</span>
                      ) : (
                        <span className="text-muted-foreground">Non presente</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={STATO_VARIANT[r.stato]}>{STATO_LABEL[r.stato]}</Badge>
                    </td>
                    <td className="p-3">
                      <RegistrazioneFormativaDialog
                        personaId={personaId}
                        corsi={corsi}
                        abilitazioni={abilitazioni}
                        registrazione={r}
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
    </div>
  );
}
