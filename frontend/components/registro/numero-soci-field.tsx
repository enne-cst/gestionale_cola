"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldVerificationPopover } from "@/components/registro/field-verification-popover";
import { RiduzioneSociDialog } from "@/components/registro/riduzione-soci-dialog";
import { VisibilityToggle } from "@/components/registro/visibility-toggle";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { impostaNumeroComponentiSoci, type TitolareIncarico } from "@/lib/actions/registro";
import type { FieldState } from "@/lib/types/registro";

/** "Numero dei soci" — § richiesta esplicita dell'utente (31/08/2026,
 * seguito): stesso identico comportamento di `NumeroComponentiOrganoField`
 * (Amministratori), qui per la tabella soci: sincronizzazione bidirezionale
 * con le righe della tabella (`IncaricoTable`, che aggiorna/decrementa
 * questo stesso valore lato backend ad ogni riga aggiunta/eliminata, vedi
 * `app.core.incarichi.sincronizza_numero_soci_dopo_aggiunta/_eliminazione`).
 * Il campo si scrive SUBITO tramite un endpoint dedicato
 * (`impostaNumeroComponentiSoci`), non tramite la bozza/"Salva modifiche"
 * della sezione — ma resta raggiungibile SOLO col banner "Modifica dati"
 * attivo, per questo `SectionContent` monta questo componente solo nel
 * ramo "in modifica" (mai in quello di sola lettura, dove il campo torna
 * un normale `FieldRow`). Sostituisce il rendering generico di `FieldRow`
 * solo per questa chiave di campo. */
export function NumeroSociField({ sectionKey, field }: { sectionKey: string; field: FieldState }) {
  const { ruolo, toggleVisibility, refreshSectionSnapshot } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const [valore, setValore] = useState(field.value ?? "");
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [riduzione, setRiduzione] = useState<{ obiettivo: number; count: number; titolari: TitolareIncarico[] } | null>(
    null,
  );

  // Il valore reale vive sul server (scritto anche dalla tabella, fuori dal
  // controllo di questo componente): quando la sezione viene ricaricata o
  // la tabella lo cambia, riallinea il campo — mai mentre l'utente sta
  // ancora scrivendo un valore diverso non ancora salvato/in dialogo.
  useEffect(() => {
    if (!salvando && riduzione === null) setValore(field.value ?? "");
  }, [field.value, salvando, riduzione]);

  async function applica(nuovoValore: number, incarichiDaEliminare?: string[]) {
    setSalvando(true);
    setErrore(null);
    const esito = await impostaNumeroComponentiSoci(nuovoValore, incarichiDaEliminare);
    setSalvando(false);
    if (esito.esito === "ok") {
      refreshSectionSnapshot(sectionKey, esito.sezione);
      setRiduzione(null);
      return;
    }
    if (esito.esito === "riduzione_richiesta") {
      setRiduzione({ obiettivo: nuovoValore, count: esito.count, titolari: esito.titolari });
      return;
    }
    setErrore(esito.messaggio);
    setValore(field.value ?? "");
  }

  function onBlur() {
    const attuale = field.value ? Number(field.value) : null;
    const numero = valore.trim() === "" ? NaN : Number(valore);
    if (!Number.isFinite(numero) || numero === attuale) {
      setValore(field.value ?? "");
      return;
    }
    if (numero < 1) {
      setErrore("Il numero dei soci deve essere almeno 1");
      setValore(field.value ?? "");
      return;
    }
    applica(Math.trunc(numero));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="mb-[7px] flex min-h-[23px] items-center gap-2">
        <Label htmlFor={`campo-${sectionKey}-${field.key}`} className="text-xs font-semibold text-[#43588e]">
          {field.label}
        </Label>
        {(consulente || field.verificationStatus) && (
          <span className="ml-auto inline-flex items-center gap-[5px]">
            {consulente && (
              <VisibilityToggle
                label={field.label}
                visible={field.visibleToCompany}
                onToggle={() => toggleVisibility(sectionKey, field.key, !field.visibleToCompany)}
              />
            )}
            {field.verificationStatus && <FieldVerificationPopover sectionKey={sectionKey} field={field} />}
          </span>
        )}
      </div>
      <Input
        id={`campo-${sectionKey}-${field.key}`}
        type="number"
        min={1}
        value={valore}
        disabled={salvando}
        aria-invalid={Boolean(errore)}
        onChange={(e) => setValore(e.target.value)}
        onBlur={onBlur}
      />
      {errore && <p className="text-xs text-destructive">{errore}</p>}
      <RiduzioneSociDialog
        stato={riduzione}
        salvando={salvando}
        errore={errore}
        onAnnulla={() => {
          setRiduzione(null);
          setValore(field.value ?? "");
        }}
        onConferma={(incarichiDaEliminare) => {
          if (riduzione) applica(riduzione.obiettivo, incarichiDaEliminare);
        }}
      />
    </div>
  );
}
