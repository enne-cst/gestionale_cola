"use client";

import { useEffect, useState } from "react";

import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CatalogoVoce } from "@/lib/types/anagrafica-iso9001";
import type { TitoloAbilitativoCertificazione } from "@/lib/types/anagrafica";

import { getCatalogoTitoloAbilitativo } from "./actions";
import { AsyncCatalogSelectField } from "./async-catalog-select-field";
import { CampiComuniFields } from "./campi-comuni-fields";
import { SettoriIafSelectField } from "./settori-iaf-select-field";
import { SoaCategorieField } from "./soa-categorie-field";

/** Sotto-form del form "Aggiungi certificazione o attestazione" (§ punto 5):
 * la tipologia scelta (catalogo `cat_tipologie_certificazione_attestazione`,
 * 3 configurazioni iniziali) determina dinamicamente il resto del form.
 *
 * § punto 6: "se l'utente cambia tipologia durante la compilazione, il
 * sistema deve avvisare che i campi specifici verranno azzerati" — qui
 * tramite un banner di conferma inline (mai un `window.confirm`, fuori
 * convenzione del progetto) che, una volta confermato, incrementa
 * `resetKey`: la sottosezione specifica viene rimontata da React con `key`
 * diversa, quindi i suoi campi (tutti non controllati, `defaultValue`)
 * ripartono vuoti — non serve svuotarli uno per uno a mano. */
export function CertificazioneFormFields({ dati }: { dati?: TitoloAbilitativoCertificazione }) {
  const [sottoTipi, setSottoTipi] = useState<CatalogoVoce[] | null>(null);
  const [sottoTipoId, setSottoTipoId] = useState(dati?.sotto_tipo_id ?? "");
  const [resetKey, setResetKey] = useState(0);
  const [richiestaConferma, setRichiestaConferma] = useState<string | null>(null);

  useEffect(() => {
    getCatalogoTitoloAbilitativo("tipologie-certificazione-attestazione")
      .then(setSottoTipi)
      .catch(() => setSottoTipi([]));
  }, []);

  const sottoTipoCodice = sottoTipi?.find((s) => s.id === sottoTipoId)?.codice ?? null;

  function onCambiaSottoTipo(nuovoId: string) {
    if (sottoTipoId && sottoTipoId !== nuovoId) {
      setRichiestaConferma(nuovoId);
      return;
    }
    setSottoTipoId(nuovoId);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sotto_tipo_id" className="text-muted-foreground">
          Tipologia di certificazione o attestazione
          <span className="text-destructive"> *</span>
        </Label>
        <Select value={sottoTipoId} onValueChange={onCambiaSottoTipo}>
          <SelectTrigger id="sotto_tipo_id" className="w-full">
            <SelectValue placeholder={sottoTipi === null ? "Caricamento…" : "Seleziona..."} />
          </SelectTrigger>
          <SelectContent>
            {(sottoTipi ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.denominazione}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="sotto_tipo_id" value={sottoTipoId} required />
      </div>

      {richiestaConferma && (
        <div className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-[var(--az-ink)]">
            Cambiando tipologia, i campi specifici già compilati per la tipologia precedente verranno azzerati.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setRichiestaConferma(null)}>
              Annulla
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setSottoTipoId(richiestaConferma);
                setResetKey((k) => k + 1);
                setRichiestaConferma(null);
              }}
            >
              Conferma cambio
            </Button>
          </div>
        </div>
      )}

      <div key={`${sottoTipoId}-${resetKey}`} className="flex flex-col gap-4">
        {sottoTipoCodice === "CERTIFICAZIONE_SISTEMA" && (
          <>
            <AsyncCatalogSelectField
              label="Norma"
              name="norma_id"
              defaultValue={resetKey === 0 ? dati?.norma_id : null}
              loader={() => getCatalogoTitoloAbilitativo("norme-certificazione")}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Edizione / anno della norma"
                name="edizione_anno"
                defaultValue={resetKey === 0 ? dati?.edizione_anno : null}
              />
              <FormField
                label="Organismo di accreditamento"
                name="organismo_accreditamento"
                defaultValue={resetKey === 0 ? dati?.organismo_accreditamento : null}
              />
              <FormField
                label="Data di prima emissione"
                name="data_prima_emissione"
                type="date"
                defaultValue={resetKey === 0 ? dati?.data_prima_emissione : null}
              />
            </div>
            <FormTextareaField
              label="Campo di applicazione"
              name="campo_applicazione"
              defaultValue={resetKey === 0 ? dati?.campo_applicazione : null}
            />
            <SettoriIafSelectField dati={resetKey === 0 ? dati?.settori_iaf.map((s) => s.id) : undefined} />
          </>
        )}

        {sottoTipoCodice === "ATTESTAZIONE_SOA" && (
          <SoaCategorieField dati={resetKey === 0 ? dati?.categorie_soa : undefined} />
        )}

        {sottoTipoCodice === "ALTRA" && (
          <>
            <FormField label="Denominazione" name="denominazione" defaultValue={resetKey === 0 ? dati?.denominazione : null} />
            <FormField
              label="Schema / norma di riferimento"
              name="schema_norma"
              defaultValue={resetKey === 0 ? dati?.schema_norma : null}
            />
            <FormTextareaField
              label="Campo di applicazione"
              name="campo_applicazione"
              defaultValue={resetKey === 0 ? dati?.campo_applicazione : null}
            />
          </>
        )}
      </div>

      <CampiComuniFields
        dati={dati}
        etichettaNumero={
          sottoTipoCodice === "ATTESTAZIONE_SOA"
            ? "Numero dell'attestazione"
            : sottoTipoCodice === "ALTRA"
              ? "Numero"
              : "Numero del certificato"
        }
        etichettaEnte={
          sottoTipoCodice === "ATTESTAZIONE_SOA"
            ? "Organismo SOA"
            : sottoTipoCodice === "ALTRA"
              ? "Ente emittente"
              : "Organismo di certificazione"
        }
      />
    </div>
  );
}
