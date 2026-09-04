"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogoVoce } from "@/lib/types/personale-hr";

import { creaMansione, creaPersona, creaReparto } from "./actions";
import { QuickAddCatalogo } from "./quick-add-catalogo";

/** Form "Nuova persona" (§9.4): solo dati essenziali + primo rapporto. Il
 * resto (Dossier personale) si completa in seguito nel tab Persona e
 * rapporto — creazione persona+rapporto atomica lato backend. */
export function NuovaPersonaDialog({
  mansioni,
  reparti,
  tipiRapporto,
  children,
}: {
  mansioni: CatalogoVoce[];
  reparti: CatalogoVoce[];
  tipiRapporto: CatalogoVoce[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inviando, setInviando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [mansioniLocali, setMansioniLocali] = useState(mansioni);
  const [repartiLocali, setRepartiLocali] = useState(reparti);

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoRapportoId, setTipoRapportoId] = useState("");
  const [dataInizio, setDataInizio] = useState("");
  const [mansioneId, setMansioneId] = useState("");
  const [repartoId, setRepartoId] = useState("");
  const [note, setNote] = useState("");

  function resetForm() {
    setNome("");
    setCognome("");
    setCodiceFiscale("");
    setEmail("");
    setTelefono("");
    setTipoRapportoId("");
    setDataInizio("");
    setMansioneId("");
    setRepartoId("");
    setNote("");
    setErrore(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !cognome || !codiceFiscale || !tipoRapportoId || !dataInizio || !mansioneId || !repartoId) {
      setErrore("Compila tutti i campi obbligatori.");
      return;
    }
    setInviando(true);
    setErrore(null);
    const risultato = await creaPersona({
      persona: { nome, cognome, codice_fiscale: codiceFiscale, email: email || null, telefono: telefono || null },
      rapporto: {
        tipo_rapporto_id: tipoRapportoId,
        data_inizio: dataInizio,
        mansione_id: mansioneId,
        reparto_id: repartoId,
        note: note || null,
      },
    });
    setInviando(false);
    if (!risultato.ok) {
      const dettaglio = risultato.detail;
      setErrore(typeof dettaglio === "string" ? dettaglio : "Dati non validi. Controlla i campi e riprova.");
      return;
    }
    setOpen(false);
    resetForm();
    router.push(`/personale?view=people&personId=${risultato.data.id}&tab=overview`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuova persona</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="np-nome">Nome *</Label>
              <Input id="np-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="np-cognome">Cognome *</Label>
              <Input id="np-cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} required />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="np-cf">Codice fiscale *</Label>
              <Input id="np-cf" value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="np-tel">Telefono</Label>
              <Input id="np-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="np-email">Email</Label>
              <Input id="np-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Primo rapporto</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Tipo di rapporto *</Label>
                <Select value={tipoRapportoId} onValueChange={setTipoRapportoId}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {tipiRapporto.map((t) => <SelectItem key={t.id} value={t.id}>{t.denominazione}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="np-data-inizio">Data inizio *</Label>
                <Input id="np-data-inizio" type="date" value={dataInizio} onChange={(e) => setDataInizio(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Mansione *</Label>
                <Select value={mansioneId} onValueChange={setMansioneId}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {mansioniLocali.map((m) => <SelectItem key={m.id} value={m.id}>{m.denominazione}</SelectItem>)}
                  </SelectContent>
                </Select>
                <QuickAddCatalogo
                  etichetta="mansione"
                  onCreate={async (denominazione) => {
                    const r = await creaMansione({ codice: denominazione.toUpperCase().replace(/\s+/g, "_"), denominazione });
                    if (r.ok) {
                      setMansioniLocali((prev) => [...prev, r.data]);
                      setMansioneId(r.data.id);
                    }
                    return r.ok;
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Reparto *</Label>
                <Select value={repartoId} onValueChange={setRepartoId}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {repartiLocali.map((r) => <SelectItem key={r.id} value={r.id}>{r.denominazione}</SelectItem>)}
                  </SelectContent>
                </Select>
                <QuickAddCatalogo
                  etichetta="reparto"
                  onCreate={async (denominazione) => {
                    const r = await creaReparto({ codice: denominazione.toUpperCase().replace(/\s+/g, "_"), denominazione });
                    if (r.ok) {
                      setRepartiLocali((prev) => [...prev, r.data]);
                      setRepartoId(r.data.id);
                    }
                    return r.ok;
                  }}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="np-note">Note</Label>
                <Textarea id="np-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
              </div>
            </div>
          </div>

          {errore && <p className="text-sm text-destructive">{errore}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
            <Button type="submit" disabled={inviando}>{inviando ? "Salvataggio..." : "Crea persona"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
