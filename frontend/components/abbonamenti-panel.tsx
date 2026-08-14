"use client";

import { useActionState, useEffect, useState } from "react";

import { FormCheckboxField } from "@/components/form-checkbox-field";
import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { FormSelectField } from "@/components/form-select-field";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Abbonamento, CertificazioneCatalogo, StatoCertificazioneCatalogo } from "@/lib/types/abbonamenti";

export type AbbonamentoFormState = { error?: string; success?: boolean };

type UpsertAction = (
  aziendaId: string,
  certificazioneId: string,
  prevState: AbbonamentoFormState,
  formData: FormData,
) => Promise<AbbonamentoFormState>;

type DisattivaAction = (aziendaId: string, certificazioneId: string, formData: FormData) => Promise<void>;

const BADGE_VARIANTE: Record<string, "default" | "secondary" | "destructive"> = {
  ATTIVA: "default",
  PROVA: "default",
  SCADUTA: "destructive",
  DISATTIVATA: "secondary",
};

/** Pannello di gestione degli abbonamenti (certificazioni attive) di
 * un'azienda: un riquadro per ciascuna certificazione del catalogo, con lo
 * stato corrente e un accesso alla configurazione del ciclo di vita
 * completo (stato, date, rinnovo automatico). Condiviso tra l'area
 * consulente e l'area super admin: le due pagine chiamanti passano le
 * rispettive Server Action, che scrivono su endpoint diversi ma con lo
 * stesso contratto (vedi app/core/abbonamenti.py sul backend). */
export function AbbonamentiPanel({
  aziendaId,
  abbonamenti,
  certificazioni,
  stati,
  upsertAction,
  disattivaAction,
}: {
  aziendaId: string;
  abbonamenti: Abbonamento[];
  certificazioni: CertificazioneCatalogo[];
  stati: StatoCertificazioneCatalogo[];
  upsertAction: UpsertAction;
  disattivaAction: DisattivaAction;
}) {
  const abbonamentoPer = new Map(abbonamenti.map((a) => [a.certificazione_id, a]));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {certificazioni.map((certificazione) => (
        <AbbonamentoCard
          key={certificazione.id}
          aziendaId={aziendaId}
          certificazione={certificazione}
          abbonamento={abbonamentoPer.get(certificazione.id)}
          stati={stati}
          upsertAction={upsertAction}
          disattivaAction={disattivaAction}
        />
      ))}
    </div>
  );
}

function AbbonamentoCard({
  aziendaId,
  certificazione,
  abbonamento,
  stati,
  upsertAction,
  disattivaAction,
}: {
  aziendaId: string;
  certificazione: CertificazioneCatalogo;
  abbonamento?: Abbonamento;
  stati: StatoCertificazioneCatalogo[];
  upsertAction: UpsertAction;
  disattivaAction: DisattivaAction;
}) {
  const attivo = abbonamento !== undefined && abbonamento.stato_codice !== "DISATTIVATA";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          {certificazione.nome}
          {abbonamento ? (
            <Badge variant={BADGE_VARIANTE[abbonamento.stato_codice] ?? "secondary"}>{abbonamento.stato_codice}</Badge>
          ) : (
            <Badge variant="secondary">Mai attivato</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {abbonamento && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Attivazione</dt>
            <dd>{abbonamento.data_attivazione}</dd>
            <dt className="text-muted-foreground">Scadenza</dt>
            <dd>{abbonamento.data_scadenza}</dd>
            <dt className="text-muted-foreground">Rinnovo automatico</dt>
            <dd>{abbonamento.rinnovo_automatico ? "Sì" : "No"}</dd>
          </dl>
        )}
        <div className="flex gap-2">
          <ConfiguraDialog
            aziendaId={aziendaId}
            certificazione={certificazione}
            abbonamento={abbonamento}
            stati={stati}
            upsertAction={upsertAction}
          />
          {attivo && (
            <form action={disattivaAction.bind(null, aziendaId, certificazione.id)}>
              <Button type="submit" variant="outline" size="sm">
                Disattiva
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ConfiguraDialog({
  aziendaId,
  certificazione,
  abbonamento,
  stati,
  upsertAction,
}: {
  aziendaId: string;
  certificazione: CertificazioneCatalogo;
  abbonamento?: Abbonamento;
  stati: StatoCertificazioneCatalogo[];
  upsertAction: UpsertAction;
}) {
  const [open, setOpen] = useState(false);
  const action = upsertAction.bind(null, aziendaId, certificazione.id);
  const [state, formAction] = useActionState<AbbonamentoFormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          {abbonamento ? "Modifica" : "Attiva"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{certificazione.nome}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <FormSelectField
            label="Stato"
            name="stato_codice"
            options={stati.map((s) => ({ value: s.nome, label: s.nome }))}
            defaultValue={abbonamento?.stato_codice ?? "ATTIVA"}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Data attivazione"
              name="data_attivazione"
              type="date"
              defaultValue={abbonamento?.data_attivazione}
              required
            />
            <FormField
              label="Data scadenza"
              name="data_scadenza"
              type="date"
              defaultValue={abbonamento?.data_scadenza}
              required
            />
          </div>
          <FormCheckboxField
            label="Rinnovo automatico"
            name="rinnovo_automatico"
            defaultChecked={abbonamento?.rinnovo_automatico ?? true}
          />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
