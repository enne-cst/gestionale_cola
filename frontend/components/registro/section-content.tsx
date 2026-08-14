"use client";

import { useEffect, type ReactNode } from "react";
import { AlertCircleIcon, Loader2Icon, PencilIcon, ShieldCheckIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldRow } from "@/components/registro/field-row";
import { VerificationLegend } from "@/components/registro/verification-indicator";
import { useWorkspace } from "@/components/registro/workspace-provider";

const ETICHETTA_COMPLETAMENTO: Record<string, { testo: string; variante: "outline" | "secondary" }> = {
  NOT_STARTED: { testo: "Da completare", variante: "outline" },
  IN_PROGRESS: { testo: "Da completare", variante: "outline" },
  COMPLETE: { testo: "Completa", variante: "secondary" },
};

// Titolo di fallback prima che la sezione risulti caricata (§11.1: titolo e
// struttura della superficie restano stabili durante il caricamento). Unica
// sezione del pilota: nessuna mappa serve finché non ce n'è una seconda.
const TITOLO_FALLBACK = "Informazioni societarie";

export function SectionContent({
  sectionKey,
  headerActions,
  onClose,
}: {
  sectionKey: string;
  headerActions?: ReactNode;
  onClose?: () => void;
}) {
  const { state, ruolo, ensureLoaded, reload, enterEdit, updateField, requestDiscard, save } = useWorkspace();
  const entry = state.sections[sectionKey];

  useEffect(() => {
    ensureLoaded(sectionKey);
  }, [sectionKey, ensureLoaded]);

  const header = (
    <div className="flex items-start justify-between gap-3 border-b border-border p-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">{entry?.server?.title ?? TITOLO_FALLBACK}</h2>
          {entry?.server && (
            <Badge variant={ETICHETTA_COMPLETAMENTO[entry.server.completionStatus].variante}>
              {ETICHETTA_COMPLETAMENTO[entry.server.completionStatus].testo}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {entry?.editing ? "Modifica dei dati identificativi e societari" : "Dati identificativi e societari dell'azienda"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {headerActions}
        {onClose && (
          <Button type="button" variant="outline" size="icon-sm" aria-label="Chiudi" onClick={onClose}>
            ×
          </Button>
        )}
      </div>
    </div>
  );

  if (!entry || (entry.loading && !entry.server)) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        {header}
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Caricamento dati…
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (entry.error && !entry.server) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        {header}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <AlertCircleIcon className="size-10 text-destructive" />
          <div>
            <p className="font-semibold text-foreground">Impossibile caricare i dati</p>
            <p className="text-sm text-muted-foreground">Si è verificato un problema durante il caricamento. Riprova.</p>
          </div>
          <Button type="button" onClick={() => reload(sectionKey)}>
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  const section = entry.server;
  if (!section) return null;

  const modificando = entry.editing;
  const tuttiCampi = section.groups.flatMap((g) => g.fields);
  const tuttiVerificati =
    tuttiCampi.some((f) => f.verificationStatus !== null) &&
    tuttiCampi.every((f) => f.verificationStatus === null || f.verificationStatus === "VERIFIED");

  async function onSalva() {
    await save(sectionKey);
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {header}

      {entry.error && (
        <Alert variant="destructive" className="m-4">
          <AlertTitle>Attenzione</AlertTitle>
          <AlertDescription>{entry.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-1 flex-col gap-6 p-4">
        {section.groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {group.fields.map((field) => (
                <FieldRow
                  key={field.key}
                  sectionKey={sectionKey}
                  field={field}
                  mode={modificando ? "EDIT" : "VIEW"}
                  draftValue={entry.draft?.[field.key] ?? null}
                  error={entry.fieldErrors[field.key]}
                  disabled={entry.saving}
                  onChange={(value) => updateField(sectionKey, field.key, value)}
                />
              ))}
            </div>
          </div>
        ))}

        {ruolo === "CONSULENTE" && (
          <>
            <VerificationLegend />
            <p className="text-xs text-muted-foreground">I campi oscurati non sono visibili all'azienda</p>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border p-4">
        {modificando ? (
          <>
            <span className="text-xs text-muted-foreground">
              {Object.keys(entry.fieldErrors).length > 0 ? "Modifica i campi evidenziati" : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => requestDiscard(sectionKey)} disabled={entry.saving}>
                Annulla
              </Button>
              <Button type="button" onClick={onSalva} disabled={entry.saving || Object.keys(entry.fieldErrors).length > 0}>
                {entry.saving ? "Salvataggio…" : "Salva modifiche"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button type="button" onClick={() => enterEdit(sectionKey)}>
              <PencilIcon className="size-4" />
              Modifica dati
            </Button>
            {ruolo === "CONSULENTE" && tuttiVerificati && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheckIcon className="size-4" />
                Dati verificati
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
