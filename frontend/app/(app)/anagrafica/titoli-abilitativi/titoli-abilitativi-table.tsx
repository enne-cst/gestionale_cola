"use client";

import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { DeleteButton } from "@/components/delete-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TitoloAbilitativoVerificationPopover } from "@/components/registro/titolo-abilitativo-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { formatDate } from "@/lib/format";
import type { TitoloAbilitativoDetail, TitoloAbilitativoSummary } from "@/lib/types/anagrafica";

import { eliminaTitoloAbilitativo, getTitoloAbilitativo, getTitoliAbilitativi } from "./actions";
import { AlboDialog } from "./albo-dialog";
import { CertificazioneDialog } from "./certificazione-dialog";
import { LicenzaDialog } from "./licenza-dialog";
import { RuoloDialog } from "./ruolo-dialog";

type DialogoAperto =
  | { tipo: "ALBO"; dati?: Extract<TitoloAbilitativoDetail, { macro_tipologia_codice: "ALBO" }> }
  | { tipo: "RUOLO"; dati?: Extract<TitoloAbilitativoDetail, { macro_tipologia_codice: "RUOLO" }> }
  | { tipo: "LICENZA"; dati?: Extract<TitoloAbilitativoDetail, { macro_tipologia_codice: "LICENZA" }> }
  | {
      tipo: "CERTIFICAZIONE_ATTESTAZIONE";
      dati?: Extract<TitoloAbilitativoDetail, { macro_tipologia_codice: "CERTIFICAZIONE_ATTESTAZIONE" }>;
    };

/** Tabella unificata "Albi, ruoli, licenze e certificazioni" (§ Correzione
 * 20): visualizzazione unica per le 4 macro-tipologie, inserimento e
 * modifica tramite 4 form personalizzati distinti (§ punto 1/5/6). Vive
 * nella stessa card composita di "Attività economica"
 * (cciaa-section-panel.tsx, case "attivita-albi"): `sectionKey` collega il
 * pulsante "Aggiungi" e il click sulla riga alla stessa modalità modifica
 * del banner "Modifica dati" della scheda, mai un toggle locale (§
 * [[correzione01-toggle-tabella-vs-scheda]]).
 *
 * A differenza dei blocchi incorporati esistenti (Codici ATECO, ...) non
 * ha un pulsante "Aggiorna" proprio: si ricarica da sola dopo ogni
 * salvataggio o eliminazione riuscita. */
export function TitoliAbilitativiTable({ sectionKey }: { sectionKey: string }) {
  const { ruolo, state } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const editing = state.sections[sectionKey]?.editing ?? false;

  const [titoli, setTitoli] = useState<TitoloAbilitativoSummary[] | null>(null);
  const [dialogo, setDialogo] = useState<DialogoAperto | null>(null);
  const [caricamentoRiga, setCaricamentoRiga] = useState<string | null>(null);

  const carica = useCallback(() => {
    getTitoliAbilitativi()
      .then(setTitoli)
      .catch(() => setTitoli([]));
  }, []);

  useEffect(() => {
    carica();
  }, [carica]);

  // § punto 8: "selezionando una riga la piattaforma riconosce la
  // tipologia e apre il form corrispondente" — solo in modalità modifica,
  // stessa convenzione del resto della scheda (in sola lettura le righe
  // non aprono nulla).
  async function apriRiga(id: string) {
    if (!editing || caricamentoRiga) return;
    setCaricamentoRiga(id);
    try {
      const dettaglio = await getTitoloAbilitativo(id);
      setDialogo({ tipo: dettaglio.macro_tipologia_codice, dati: dettaglio } as DialogoAperto);
    } finally {
      setCaricamentoRiga(null);
    }
  }

  async function elimina(id: string) {
    await eliminaTitoloAbilitativo(id);
    carica();
  }

  const righe = titoli ?? [];

  return (
    <>
      <DataTableCard
        title="Albi, ruoli, licenze e certificazioni"
        count={righe.length}
        editing={editing}
        addTrigger={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <AddRowButton icon={PlusIcon} label="Aggiungi" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDialogo({ tipo: "ALBO" })}>Aggiungi albo</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogo({ tipo: "RUOLO" })}>Aggiungi ruolo</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogo({ tipo: "LICENZA" })}>Aggiungi licenza</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogo({ tipo: "CERTIFICAZIONE_ATTESTAZIONE" })}>
                Aggiungi certificazione o attestazione
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        {titoli === null ? (
          <EmptyTableMessage>Caricamento…</EmptyTableMessage>
        ) : righe.length === 0 ? (
          <EmptyTableMessage>Nessun albo, ruolo, licenza o certificazione registrato.</EmptyTableMessage>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipologia</TableHead>
                  <TableHead>Categoria / norma</TableHead>
                  <TableHead>Numero / attestazione</TableHead>
                  <TableHead>Ente</TableHead>
                  <TableHead>Data di rilascio</TableHead>
                  <TableHead>Data di scadenza</TableHead>
                  <TableHead>Stato</TableHead>
                  {editing && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {righe.map((t) => (
                  <TableRow
                    key={t.id}
                    onClick={() => apriRiga(t.id)}
                    aria-busy={caricamentoRiga === t.id}
                    className={editing ? "cursor-pointer" : undefined}
                  >
                    <TableCell className="font-medium">{t.tipologia_label}</TableCell>
                    <TableCell>{t.categoria_norma ?? "—"}</TableCell>
                    <TableCell>{t.numero_attestazione ?? "—"}</TableCell>
                    <TableCell>{t.ente_rilascio ?? "—"}</TableCell>
                    <TableCell>{formatDate(t.data_rilascio)}</TableCell>
                    <TableCell>{t.senza_scadenza ? "Nessuna scadenza" : formatDate(t.data_scadenza)}</TableCell>
                    <TableCell>
                      <TitoloAbilitativoVerificationPopover
                        titolo={t}
                        consulente={consulente}
                        onDecided={carica}
                        disabled={editing}
                      />
                    </TableCell>
                    {editing && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DeleteButton
                          action={elimina.bind(null, t.id)}
                          confirmMessage={`Eliminare "${t.tipologia_label}"?`}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableCard>

      <AlboDialog
        open={dialogo?.tipo === "ALBO"}
        dati={dialogo?.tipo === "ALBO" ? dialogo.dati : undefined}
        onOpenChange={(open) => !open && setDialogo(null)}
        onSaved={carica}
      />
      <RuoloDialog
        open={dialogo?.tipo === "RUOLO"}
        dati={dialogo?.tipo === "RUOLO" ? dialogo.dati : undefined}
        onOpenChange={(open) => !open && setDialogo(null)}
        onSaved={carica}
      />
      <LicenzaDialog
        open={dialogo?.tipo === "LICENZA"}
        dati={dialogo?.tipo === "LICENZA" ? dialogo.dati : undefined}
        onOpenChange={(open) => !open && setDialogo(null)}
        onSaved={carica}
      />
      <CertificazioneDialog
        open={dialogo?.tipo === "CERTIFICAZIONE_ATTESTAZIONE"}
        dati={dialogo?.tipo === "CERTIFICAZIONE_ATTESTAZIONE" ? dialogo.dati : undefined}
        onOpenChange={(open) => !open && setDialogo(null)}
        onSaved={carica}
      />
    </>
  );
}
