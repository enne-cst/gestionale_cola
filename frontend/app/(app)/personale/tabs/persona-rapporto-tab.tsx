"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CatalogoVoce, PersonaDossier, PersonaProfilo } from "@/lib/types/personale-hr";

import { aggiornaProfiloPersona } from "../actions";
import { useDirtyGuard } from "../person-detail";

const SESSO_OPZIONI = ["Maschio", "Femmina", "Non specificato"];
const COMPRENSIONE_OPZIONI = ["Adeguata", "Parziale", "Da verificare", "Non adeguata"];
const PERMESSO_SOGGIORNO_OPZIONI: { value: PersonaDossier["permesso_soggiorno_stato"]; label: string }[] = [
  { value: "NON_INDICATO", label: "Non indicato" },
  { value: "NON_APPLICABILE", label: "Non applicabile" },
  { value: "POSSEDUTO", label: "Posseduto" },
];

/** Età derivata dalla data di nascita (§6 della correzione): mai salvata,
 * ricalcolata qui con lo stesso algoritmo del backend (vedi
 * `app.core.personale_hr.calcola_eta`) così l'anteprima si aggiorna subito
 * mentre si modifica la data, prima ancora di salvare. */
function calcolaEta(dataNascita: string | null): number | null {
  if (!dataNascita) return null;
  const nascita = new Date(dataNascita);
  if (Number.isNaN(nascita.getTime())) return null;
  const oggi = new Date();
  let eta = oggi.getFullYear() - nascita.getFullYear();
  const compleannoPassato =
    oggi.getMonth() > nascita.getMonth() ||
    (oggi.getMonth() === nascita.getMonth() && oggi.getDate() >= nascita.getDate());
  if (!compleannoPassato) eta -= 1;
  return eta;
}

/** Tab "Persona e rapporto" (§12, correzione struttura). "Dati essenziali" e
 * il "Dossier personale" condividono lo stesso stato di modifica/salvataggio
 * — un solo pulsante "Modifica dati", una sola chiamata di salvataggio. Il
 * blocco "Rapporto corrente con l'azienda" non è più mostrato come card
 * autonoma: i suoi dati restano leggibili/modificabili nel Dossier
 * ("Dettagli contrattuali"), tranne "Durata del rapporto" (tipo_rapporto),
 * di sola lettura come mansione/reparto — cambiarla richiede chiudere il
 * periodo e aprirne uno nuovo (§12.2), flusso non ancora costruito. */
export function PersonaRapportoTab({
  persona,
  mansioni: _mansioni,
  reparti: _reparti,
  tipiRapporto: _tipiRapporto,
}: {
  persona: PersonaProfilo;
  mansioni: CatalogoVoce[];
  reparti: CatalogoVoce[];
  tipiRapporto: CatalogoVoce[];
}) {
  const { setDirty, registerSave } = useDirtyGuard();
  const [editing, setEditing] = useState(false);
  const [dossierAperto, setDossierAperto] = useState(false);

  const [nome, setNome] = useState(persona.nome);
  const [cognome, setCognome] = useState(persona.cognome);
  const [codiceFiscale, setCodiceFiscale] = useState(persona.codice_fiscale);
  const [telefono, setTelefono] = useState(persona.telefono ?? "");
  const [email, setEmail] = useState(persona.email ?? "");

  const [dossier, setDossier] = useState<PersonaDossier>(persona.dossier);

  const rapporto = persona.rapporto_corrente;
  const [dataFinePrevista, setDataFinePrevista] = useState(rapporto?.data_fine_prevista ?? "");
  const [tempoLavoro, setTempoLavoro] = useState(rapporto?.tempo_lavoro ?? "PIENO");
  const [percentualePartTime, setPercentualePartTime] = useState(
    rapporto?.percentuale_part_time != null ? String(rapporto.percentuale_part_time) : "",
  );
  const [ccnl, setCcnl] = useState(rapporto?.ccnl ?? "");
  const [livelloInquadramento, setLivelloInquadramento] = useState(rapporto?.livello_inquadramento ?? "");

  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function resetCampi() {
    setNome(persona.nome);
    setCognome(persona.cognome);
    setCodiceFiscale(persona.codice_fiscale);
    setTelefono(persona.telefono ?? "");
    setEmail(persona.email ?? "");
    setDossier(persona.dossier);
    setDataFinePrevista(rapporto?.data_fine_prevista ?? "");
    setTempoLavoro(rapporto?.tempo_lavoro ?? "PIENO");
    setPercentualePartTime(rapporto?.percentuale_part_time != null ? String(rapporto.percentuale_part_time) : "");
    setCcnl(rapporto?.ccnl ?? "");
    setLivelloInquadramento(rapporto?.livello_inquadramento ?? "");
    setErrore(null);
  }

  function patchDossier(campi: Partial<PersonaDossier>) {
    setDossier((prev) => ({ ...prev, ...campi }));
    setDirty(true);
  }

  async function salva(): Promise<boolean> {
    setSalvando(true);
    setErrore(null);
    const risultato = await aggiornaProfiloPersona(persona.id, {
      persona: { nome, cognome, codice_fiscale: codiceFiscale, telefono: telefono || null, email: email || null },
      dossier,
      rapporto: rapporto
        ? {
            data_fine_prevista: dataFinePrevista || null,
            tempo_lavoro: tempoLavoro,
            percentuale_part_time: percentualePartTime ? Number(percentualePartTime) : null,
            ccnl: ccnl || null,
            livello_inquadramento: livelloInquadramento || null,
          }
        : undefined,
    });
    setSalvando(false);
    if (!risultato.ok) {
      setErrore(typeof risultato.detail === "string" ? risultato.detail : "Dati non validi.");
      return false;
    }
    setEditing(false);
    return true;
  }

  useEffect(() => {
    registerSave(editing ? salva : null);
    return () => registerSave(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, nome, cognome, codiceFiscale, telefono, email, dossier, dataFinePrevista, tempoLavoro, percentualePartTime, ccnl, livelloInquadramento]);

  function onChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  const eta = editing ? calcolaEta(dossier.data_nascita) : persona.dossier.eta;
  const aTermine = rapporto?.tipo_rapporto.codice === "DETERMINATO";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Persona e rapporto</h3>
          <p className="text-sm text-muted-foreground">Dati essenziali della persona e rapporto corrente con l'azienda</p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Modifica dati
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetCampi();
                setEditing(false);
                setDirty(false);
              }}
            >
              Annulla
            </Button>
            <Button size="sm" onClick={salva} disabled={salvando}>
              {salvando ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        )}
      </div>

      {errore && <p className="text-sm text-destructive">{errore}</p>}

      <div className="rounded-lg border border-border p-4">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Dati essenziali</h4>
        {!editing ? (
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <Campo label="Nome" valore={persona.nome} />
            <Campo label="Cognome" valore={persona.cognome} />
            <Campo label="Codice fiscale" valore={persona.codice_fiscale} />
            <Campo label="Telefono" valore={persona.telefono ?? "—"} />
            <Campo label="Email" valore={persona.email ?? "—"} />
          </dl>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <CampoInput label="Nome" value={nome} onChange={onChange(setNome)} />
            <CampoInput label="Cognome" value={cognome} onChange={onChange(setCognome)} />
            <CampoInput label="Codice fiscale" value={codiceFiscale} onChange={onChange(setCodiceFiscale)} />
            <CampoInput label="Telefono" value={telefono} onChange={onChange(setTelefono)} />
            <CampoInput label="Email" value={email} onChange={onChange(setEmail)} type="email" />
          </div>
        )}
      </div>

      <Collapsible open={dossierAperto} onOpenChange={setDossierAperto} className="rounded-lg border border-border">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Dossier personale</h4>
            <p className="text-xs text-muted-foreground">Dati anagrafici, contrattuali e operativi</p>
          </div>
          <span className="text-xs text-muted-foreground">{dossierAperto ? "Nascondi" : "Mostra"}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-4 border-t border-border p-4">
          <DossierSezione titolo="Dati anagrafici completi">
            {!editing ? (
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Campo label="Matricola interna" valore={dossier.matricola_interna ?? "—"} />
                <Campo label="Data di nascita" valore={formattaData(dossier.data_nascita)} />
                <Campo label="Età" valore={eta != null ? String(eta) : "Non disponibile"} />
                <Campo label="Luogo di nascita" valore={dossier.luogo_nascita ?? "—"} />
                <Campo label="Provincia di nascita" valore={dossier.provincia_nascita ?? "—"} />
                <Campo label="Stato di nascita" valore={dossier.stato_nascita ?? "—"} />
                <Campo label="Sesso" valore={dossier.sesso ?? "—"} />
                <Campo label="Cittadinanza" valore={dossier.cittadinanza ?? "—"} />
              </dl>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <CampoInput
                  label="Matricola interna"
                  value={dossier.matricola_interna ?? ""}
                  onChange={(v) => patchDossier({ matricola_interna: v || null })}
                />
                <CampoInput
                  label="Data di nascita"
                  type="date"
                  value={dossier.data_nascita ?? ""}
                  onChange={(v) => patchDossier({ data_nascita: v || null })}
                />
                <div className="flex flex-col gap-1.5">
                  <Label>Età</Label>
                  <div className="flex h-8 items-center text-sm text-muted-foreground">
                    {eta != null ? `${eta} anni (calcolata)` : "Non disponibile"}
                  </div>
                </div>
                <CampoInput
                  label="Luogo di nascita"
                  value={dossier.luogo_nascita ?? ""}
                  onChange={(v) => patchDossier({ luogo_nascita: v || null })}
                />
                <CampoInput
                  label="Provincia di nascita"
                  value={dossier.provincia_nascita ?? ""}
                  onChange={(v) => patchDossier({ provincia_nascita: v || null })}
                />
                <CampoInput
                  label="Stato di nascita"
                  value={dossier.stato_nascita ?? ""}
                  onChange={(v) => patchDossier({ stato_nascita: v || null })}
                />
                <CampoSelect
                  label="Sesso"
                  value={dossier.sesso}
                  opzioni={SESSO_OPZIONI}
                  onChange={(v) => patchDossier({ sesso: v })}
                />
                <CampoInput
                  label="Cittadinanza"
                  value={dossier.cittadinanza ?? ""}
                  onChange={(v) => patchDossier({ cittadinanza: v || null })}
                />
              </div>
            )}
          </DossierSezione>

          <DossierSezione titolo="Residenza e domicilio">
            {!editing ? (
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Campo label="Indirizzo di residenza" valore={dossier.indirizzo_residenza ?? "—"} />
                <Campo label="CAP" valore={dossier.cap_residenza ?? "—"} />
                <Campo label="Comune" valore={dossier.comune_residenza ?? "—"} />
                <Campo label="Provincia" valore={dossier.provincia_residenza ?? "—"} />
                <Campo
                  label="Domicilio"
                  valore={dossier.domicilio_coincide_residenza ? "Coincide con la residenza" : "Diverso dalla residenza"}
                />
                {!dossier.domicilio_coincide_residenza && (
                  <>
                    <Campo label="Indirizzo di domicilio" valore={dossier.indirizzo_domicilio ?? "—"} />
                    <Campo label="CAP domicilio" valore={dossier.cap_domicilio ?? "—"} />
                    <Campo label="Comune domicilio" valore={dossier.comune_domicilio ?? "—"} />
                    <Campo label="Provincia domicilio" valore={dossier.provincia_domicilio ?? "—"} />
                  </>
                )}
              </dl>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3">
                  <CampoInput
                    label="Indirizzo di residenza"
                    value={dossier.indirizzo_residenza ?? ""}
                    onChange={(v) => patchDossier({ indirizzo_residenza: v || null })}
                  />
                  <CampoInput
                    label="CAP"
                    value={dossier.cap_residenza ?? ""}
                    onChange={(v) => patchDossier({ cap_residenza: v || null })}
                  />
                  <CampoInput
                    label="Comune"
                    value={dossier.comune_residenza ?? ""}
                    onChange={(v) => patchDossier({ comune_residenza: v || null })}
                  />
                  <CampoInput
                    label="Provincia"
                    value={dossier.provincia_residenza ?? ""}
                    onChange={(v) => patchDossier({ provincia_residenza: v || null })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={dossier.domicilio_coincide_residenza}
                    onCheckedChange={(v) => patchDossier({ domicilio_coincide_residenza: v === true })}
                  />
                  Il domicilio coincide con la residenza
                </label>
                {!dossier.domicilio_coincide_residenza && (
                  <div className="grid grid-cols-3 gap-3">
                    <CampoInput
                      label="Indirizzo di domicilio"
                      value={dossier.indirizzo_domicilio ?? ""}
                      onChange={(v) => patchDossier({ indirizzo_domicilio: v || null })}
                    />
                    <CampoInput
                      label="CAP domicilio"
                      value={dossier.cap_domicilio ?? ""}
                      onChange={(v) => patchDossier({ cap_domicilio: v || null })}
                    />
                    <CampoInput
                      label="Comune domicilio"
                      value={dossier.comune_domicilio ?? ""}
                      onChange={(v) => patchDossier({ comune_domicilio: v || null })}
                    />
                    <CampoInput
                      label="Provincia domicilio"
                      value={dossier.provincia_domicilio ?? ""}
                      onChange={(v) => patchDossier({ provincia_domicilio: v || null })}
                    />
                  </div>
                )}
              </div>
            )}
          </DossierSezione>

          <DossierSezione titolo="Contatti personali e di emergenza">
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <Campo label="Telefono personale" valore={persona.telefono ?? "—"} />
              <Campo label="Email personale" valore={persona.email ?? "—"} />
            </dl>
            <p className="mt-1 text-xs text-muted-foreground">Telefono ed email personali si modificano in Dati essenziali.</p>
            {!editing ? (
              <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <Campo label="Contatto di emergenza" valore={dossier.contatto_emergenza_nome ?? "—"} />
                <Campo label="Relazione" valore={dossier.contatto_emergenza_relazione ?? "—"} />
                <Campo label="Telefono di emergenza" valore={dossier.contatto_emergenza_telefono ?? "—"} />
              </dl>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-3">
                <CampoInput
                  label="Contatto di emergenza"
                  value={dossier.contatto_emergenza_nome ?? ""}
                  onChange={(v) => patchDossier({ contatto_emergenza_nome: v || null })}
                />
                <CampoInput
                  label="Relazione"
                  value={dossier.contatto_emergenza_relazione ?? ""}
                  onChange={(v) => patchDossier({ contatto_emergenza_relazione: v || null })}
                />
                <CampoInput
                  label="Telefono di emergenza"
                  value={dossier.contatto_emergenza_telefono ?? ""}
                  onChange={(v) => patchDossier({ contatto_emergenza_telefono: v || null })}
                />
              </div>
            )}
          </DossierSezione>

          <DossierSezione titolo="Lingua e comprensione">
            {!editing ? (
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Campo label="Lingua madre" valore={dossier.lingua_madre ?? "—"} />
                <Campo label="Comprensione lingua italiana" valore={dossier.comprensione_lingua_italiana ?? "—"} />
                <Campo label="Supporto linguistico necessario" valore={dossier.supporto_linguistico_necessario ? "Sì" : "No"} />
                <Campo label="Altre lingue" valore={dossier.altre_lingue ?? "—"} />
              </dl>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <CampoInput
                  label="Lingua madre"
                  value={dossier.lingua_madre ?? ""}
                  onChange={(v) => patchDossier({ lingua_madre: v || null })}
                />
                <CampoSelect
                  label="Comprensione lingua italiana"
                  value={dossier.comprensione_lingua_italiana}
                  opzioni={COMPRENSIONE_OPZIONI}
                  onChange={(v) => patchDossier({ comprensione_lingua_italiana: v })}
                />
                <label className="flex items-end gap-2 pb-1.5 text-sm">
                  <Checkbox
                    checked={dossier.supporto_linguistico_necessario}
                    onCheckedChange={(v) => patchDossier({ supporto_linguistico_necessario: v === true })}
                  />
                  Supporto linguistico necessario
                </label>
                <CampoInput
                  label="Altre lingue"
                  value={dossier.altre_lingue ?? ""}
                  onChange={(v) => patchDossier({ altre_lingue: v || null })}
                />
              </div>
            )}
          </DossierSezione>

          <DossierSezione titolo="Documenti personali">
            {!editing ? (
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Campo label="Tipo di documento" valore={dossier.tipo_documento_identita ?? "—"} />
                <Campo label="Numero documento" valore={dossier.numero_documento_identita ?? "—"} />
                <Campo label="Scadenza documento" valore={formattaData(dossier.scadenza_documento_identita)} />
                <Campo
                  label="Permesso di soggiorno"
                  valore={PERMESSO_SOGGIORNO_OPZIONI.find((o) => o.value === dossier.permesso_soggiorno_stato)?.label ?? "—"}
                />
                {dossier.permesso_soggiorno_stato === "POSSEDUTO" && (
                  <Campo label="Estremi permesso di soggiorno" valore={dossier.permesso_soggiorno_dettaglio ?? "—"} />
                )}
              </dl>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <CampoInput
                  label="Tipo di documento"
                  value={dossier.tipo_documento_identita ?? ""}
                  onChange={(v) => patchDossier({ tipo_documento_identita: v || null })}
                />
                <CampoInput
                  label="Numero documento"
                  value={dossier.numero_documento_identita ?? ""}
                  onChange={(v) => patchDossier({ numero_documento_identita: v || null })}
                />
                <CampoInput
                  label="Scadenza documento"
                  type="date"
                  value={dossier.scadenza_documento_identita ?? ""}
                  onChange={(v) => patchDossier({ scadenza_documento_identita: v || null })}
                />
                <div className="flex flex-col gap-1.5">
                  <Label>Permesso di soggiorno</Label>
                  <Select
                    value={dossier.permesso_soggiorno_stato}
                    onValueChange={(v) => patchDossier({ permesso_soggiorno_stato: v as PersonaDossier["permesso_soggiorno_stato"] })}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PERMESSO_SOGGIORNO_OPZIONI.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {dossier.permesso_soggiorno_stato === "POSSEDUTO" && (
                  <CampoInput
                    label="Estremi permesso di soggiorno"
                    value={dossier.permesso_soggiorno_dettaglio ?? ""}
                    onChange={(v) => patchDossier({ permesso_soggiorno_dettaglio: v || null })}
                  />
                )}
              </div>
            )}
          </DossierSezione>

          <DossierSezione titolo="Dettagli contrattuali">
            {!rapporto ? (
              <p className="text-sm text-muted-foreground">Nessun rapporto registrato.</p>
            ) : !editing ? (
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Campo label="Durata del rapporto" valore={rapporto.tipo_rapporto.denominazione} />
                <Campo
                  label="Data di fine prevista"
                  valore={aTermine ? formattaData(rapporto.data_fine_prevista) : "Non applicabile (tempo indeterminato)"}
                />
                <Campo label="Orario" valore={rapporto.tempo_lavoro === "PARZIALE" ? "Tempo parziale" : "Tempo pieno"} />
                {rapporto.tempo_lavoro === "PARZIALE" && (
                  <Campo
                    label="Percentuale part-time"
                    valore={rapporto.percentuale_part_time != null ? `${rapporto.percentuale_part_time}%` : "—"}
                  />
                )}
                <Campo label="CCNL applicato" valore={rapporto.ccnl ?? "—"} />
                <Campo label="Livello / inquadramento" valore={rapporto.livello_inquadramento ?? "—"} />
              </dl>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Durata del rapporto</Label>
                  <div className="flex h-8 items-center text-sm text-muted-foreground">{rapporto.tipo_rapporto.denominazione}</div>
                </div>
                <CampoInput
                  label={aTermine ? "Data di fine prevista" : "Data di fine prevista (facoltativa)"}
                  type="date"
                  value={dataFinePrevista}
                  onChange={onChange(setDataFinePrevista)}
                />
                <div className="flex flex-col gap-1.5">
                  <Label>Orario</Label>
                  <Select
                    value={tempoLavoro}
                    onValueChange={(v) => {
                      setTempoLavoro(v);
                      if (v === "PIENO") setPercentualePartTime("");
                      setDirty(true);
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIENO">Tempo pieno</SelectItem>
                      <SelectItem value="PARZIALE">Tempo parziale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tempoLavoro === "PARZIALE" && (
                  <CampoInput
                    label="Percentuale part-time"
                    type="number"
                    value={percentualePartTime}
                    onChange={onChange(setPercentualePartTime)}
                  />
                )}
                <CampoInput label="CCNL applicato" value={ccnl} onChange={onChange(setCcnl)} />
                <CampoInput label="Livello / inquadramento" value={livelloInquadramento} onChange={onChange(setLivelloInquadramento)} />
              </div>
            )}
          </DossierSezione>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function DossierSezione({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-border/60 p-3">
      <h5 className="mb-3 text-sm font-semibold text-foreground">{titolo}</h5>
      {children}
    </div>
  );
}

function formattaData(valore: string | null): string {
  if (!valore) return "—";
  const data = new Date(valore);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("it-IT");
}

function Campo({ label, valore }: { label: string; valore: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{valore}</dd>
    </div>
  );
}

function CampoInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" />
    </div>
  );
}

function CampoSelect({
  label,
  value,
  opzioni,
  onChange,
}: {
  label: string;
  value: string | null;
  opzioni: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
        <SelectContent>
          {opzioni.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
