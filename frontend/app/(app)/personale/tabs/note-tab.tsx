"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { getApiResource } from "@/lib/actions/api-resource";
import type { Nota, NotaCategoriaVoce } from "@/lib/types/personale-hr";

import { EliminaNotaDialog } from "../elimina-nota-dialog";
import { NotaDialog } from "../nota-dialog";

/** Tab "Note" (specificazione "Costruzione della scheda 'Note'"): elenco
 * semplice, un solo comando "+ Nuova nota", nessuna ricerca/filtro/
 * evidenza. Le note sono riservate ai consulenti anche lato backend
 * (require_consulente_ctx su tutti gli endpoint): un utente aziendale
 * riceve 403 e questo tab mostra semplicemente l'errore di caricamento,
 * senza bisogno di una logica di visibilità propria nel frontend. */
export function NoteTab({ personaId }: { personaId: string }) {
  const [note, setNote] = useState<Nota[] | null>(null);
  const [categorie, setCategorie] = useState<NotaCategoriaVoce[]>([]);
  const [errore, setErrore] = useState<string | null>(null);

  function ricarica() {
    setErrore(null);
    Promise.all([
      getApiResource<Nota[]>(`/api/personale/persone/${personaId}/note`),
      getApiResource<NotaCategoriaVoce[]>("/api/personale/categorie-note"),
    ])
      .then(([n, c]) => {
        setNote(n);
        setCategorie(c);
      })
      .catch(() => setErrore("Impossibile caricare le note."));
  }

  useEffect(() => {
    setNote(null);
    ricarica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId]);

  if (errore) {
    return <p className="text-sm text-destructive">{errore}</p>;
  }

  if (note === null) {
    return <p className="text-sm text-muted-foreground">Caricamento…</p>;
  }

  const etichettaCategoria = (codice: string) => categorie.find((c) => c.codice === codice)?.denominazione ?? codice;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Note e annotazioni</h3>
          <p className="text-sm text-muted-foreground">Annotazioni interne associate alla persona</p>
        </div>
        <NotaDialog personaId={personaId} categorie={categorie} onSaved={ricarica} trigger={<Button size="sm">+ Nuova nota</Button>} />
      </div>

      {note.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna nota registrata per questa persona.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {note.map((n) => (
            <div key={n.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{etichettaCategoria(n.categoria)}</Badge>
                <div className="flex gap-2">
                  <NotaDialog
                    personaId={personaId}
                    categorie={categorie}
                    nota={n}
                    onSaved={ricarica}
                    trigger={
                      <Button variant="outline" size="sm">
                        Modifica
                      </Button>
                    }
                  />
                  <EliminaNotaDialog
                    notaId={n.id}
                    onDeleted={ricarica}
                    trigger={
                      <Button variant="ghost" size="sm">
                        Elimina
                      </Button>
                    }
                  />
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{n.testo}</p>
              <p className="text-xs text-muted-foreground">
                {n.autore ?? "—"} · {formatDateTime(n.created_at)}
                {n.updated_at !== n.created_at ? ` · modificata il ${formatDateTime(n.updated_at)}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
