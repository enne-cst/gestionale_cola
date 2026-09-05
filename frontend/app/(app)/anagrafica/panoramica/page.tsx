import { LayoutDashboardIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { getVociPanoramica } from "@/lib/actions/panoramica";
import { getIncarichi } from "@/lib/actions/personale";
import { getRegistroSezione } from "@/lib/actions/registro";
import { MODULO_ANAGRAFICA, sezioneBySlug } from "@/lib/anagrafica-sezioni";
import { formatValoreGenerico } from "@/lib/format";
import { formattaValore } from "@/lib/registro-format";
import { TITOLO_SEZIONE_REGISTRO } from "@/lib/registro-sezioni-meta";
import type { FieldState } from "@/lib/types/registro";

import { getTitoliAbilitativi } from "../titoli-abilitativi/actions";
import { getUnitaLocali } from "../unita-locali/actions";
import { PanoramicaLista } from "./panoramica-lista";
import { anteprimaRecord } from "./record-preview";
import type { PanoramicaItem } from "./types";

// Sezioni le cui righe non vivono dietro un endpoint REST generico
// "/api/anagrafica/{slug}" che restituisce un array (§ richiesta esplicita
// 05/09/2026): le tabelle annidate delle card CCIAA rev2 (Soci/
// Amministratori/Sindaci, Titoli abilitativi, Unità locali) hanno ognuna la
// propria server action dedicata. Le 14 sezioni ISO 9001 "a elenco" e le
// vecchie sezioni CCIAA restano invece sul percorso generico sotto.
const ELENCHI_DEDICATI: Partial<Record<string, () => Promise<Record<string, unknown>[]>>> = {
  "elenco-soci-estremi": () => getIncarichi() as unknown as Promise<Record<string, unknown>[]>,
  "amministrazione-controllo": () => getIncarichi() as unknown as Promise<Record<string, unknown>[]>,
  "organi-controllo": () => getIncarichi() as unknown as Promise<Record<string, unknown>[]>,
  "attivita-economica": () => getTitoliAbilitativi() as unknown as Promise<Record<string, unknown>[]>,
  "unita-locali": () => getUnitaLocali() as unknown as Promise<Record<string, unknown>[]>,
};

function trovaCampo(groups: { fields: FieldState[] }[], campo: string): FieldState | undefined {
  for (const group of groups) {
    const trovato = group.fields.find((f) => f.key === campo);
    if (trovato) return trovato;
  }
  return undefined;
}

export default async function PanoramicaPage() {
  const voci = await getVociPanoramica(MODULO_ANAGRAFICA);

  const sezioniCampo = [...new Set(voci.filter((v) => v.campo).map((v) => v.sezione_slug))];
  const sezioniRecord = [...new Set(voci.filter((v) => v.record_id).map((v) => v.sezione_slug))];

  // Campo di una sezione singleton: prima il "registro" campo-per-campo (§
  // ogni card CCIAA rev2/Organizzazione oggi vive lì), con fallback al
  // vecchio endpoint REST piatto per le sezioni non ancora migrate — mai
  // il contrario, il registro è la fonte viva per tutto ciò che è
  // pinnabile oggi (`FieldRow`, unico punto che offre lo spillo).
  const sezioniRegistro = new Map(
    await Promise.all(
      sezioniCampo.map(async (slug) => {
        try {
          return [slug, await getRegistroSezione(slug)] as const;
        } catch {
          return [slug, null] as const;
        }
      }),
    ),
  );
  const sezioniPiatte = new Map(
    await Promise.all(
      sezioniCampo
        .filter((slug) => !sezioniRegistro.get(slug))
        .map(async (slug) => [slug, await apiFetch<unknown>(`/api/anagrafica/${slug}`)] as const),
    ),
  );

  // Righe di una sezione a elenco: fetcher dedicato se esiste, altrimenti
  // il vecchio endpoint REST generico che restituisce un array.
  const elenchiPerSezione = new Map(
    await Promise.all(
      sezioniRecord.map(async (slug) => {
        const fetcher = ELENCHI_DEDICATI[slug];
        if (fetcher) return [slug, await fetcher()] as const;
        const dati = await apiFetch<unknown>(`/api/anagrafica/${slug}`);
        return [slug, Array.isArray(dati) ? (dati as Record<string, unknown>[]) : []] as const;
      }),
    ),
  );

  const items: PanoramicaItem[] = voci.map((voce) => {
    const sezioneTitolo =
      TITOLO_SEZIONE_REGISTRO[voce.sezione_slug] ?? sezioneBySlug(voce.sezione_slug)?.titolo ?? voce.sezione_slug;

    if (voce.campo) {
      const sezioneRegistro = sezioniRegistro.get(voce.sezione_slug);
      if (sezioneRegistro) {
        const field = trovaCampo(sezioneRegistro.groups, voce.campo);
        return {
          id: voce.id,
          modulo: voce.modulo,
          sezioneSlug: voce.sezione_slug,
          sezioneTitolo,
          titolo: voce.etichetta,
          sottotitolo: field ? formattaValore(field) : "",
          campo: voce.campo,
          recordId: null,
          disponibile: Boolean(field),
        };
      }
      const dati = sezioniPiatte.get(voce.sezione_slug);
      const singleton = dati && !Array.isArray(dati) ? (dati as Record<string, unknown> | null) : null;
      return {
        id: voce.id,
        modulo: voce.modulo,
        sezioneSlug: voce.sezione_slug,
        sezioneTitolo,
        titolo: voce.etichetta,
        sottotitolo: formatValoreGenerico(singleton?.[voce.campo]),
        campo: voce.campo,
        recordId: null,
        disponibile: true,
      };
    }

    const elenco = elenchiPerSezione.get(voce.sezione_slug) ?? [];
    const record = elenco.find((r) => r.id === voce.record_id);

    if (!record) {
      return {
        id: voce.id,
        modulo: voce.modulo,
        sezioneSlug: voce.sezione_slug,
        sezioneTitolo,
        titolo: voce.etichetta,
        sottotitolo: "",
        campo: null,
        recordId: voce.record_id,
        disponibile: false,
      };
    }

    const { titolo, sottotitolo } = anteprimaRecord(voce.sezione_slug, record);
    return {
      id: voce.id,
      modulo: voce.modulo,
      sezioneSlug: voce.sezione_slug,
      sezioneTitolo,
      titolo,
      sottotitolo,
      campo: null,
      recordId: voce.record_id,
      disponibile: true,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={LayoutDashboardIcon}
        title="Panoramica"
        subtitle="Le voci che hai scelto di tenere sott'occhio, raccolte da tutte le sezioni. Trascinale per riordinarle. Sola lettura: per modificarle vai alla sezione di origine."
      />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nessuna voce ancora selezionata. Apri una sezione e clicca l&apos;icona a forma di spillo accanto a un
          campo (o a una riga di un elenco) per aggiungerlo qui.
        </p>
      ) : (
        <PanoramicaLista modulo={MODULO_ANAGRAFICA} iniziali={items} />
      )}
    </div>
  );
}
